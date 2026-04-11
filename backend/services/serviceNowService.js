const axios = require('axios');

/**
 * ServiceNow Integration Service (Backend)
 *
 * Full workflow support:
 * - Create tickets with state, urgency, assignment
 * - Update ticket state (Approved, Rejected, Closed)
 * - Add work notes and comments
 * - Query ticket status
 * - Handle webhook callbacks from ServiceNow
 */

// ServiceNow state mapping for the access_request table
const SN_STATES = {
    NEW: '1',
    IN_PROGRESS: '2',
    AWAITING_APPROVAL: '3',
    APPROVED: '4',
    REJECTED: '5',
    CLOSED: '7',
    CANCELLED: '8'
};

const SN_STATE_LABELS = {
    '1': 'New',
    '2': 'In Progress',
    '3': 'Awaiting Approval',
    '4': 'Approved',
    '5': 'Rejected',
    '7': 'Closed',
    '8': 'Cancelled'
};

const SN_URGENCY = {
    HIGH: '1',
    MEDIUM: '2',
    LOW: '3'
};

class ServiceNowService {
    constructor() {
        this.instanceUrl = process.env.SERVICENOW_INSTANCE_URL;
        this.username = process.env.SERVICENOW_USERNAME;
        this.password = process.env.SERVICENOW_PASSWORD;
        this.tableName = process.env.SERVICENOW_TABLE_NAME || 'x_1945757_datapl_0_access_request';
        this.webhookSecret = process.env.SERVICENOW_WEBHOOK_SECRET || '';
        this.assignmentGroup = process.env.SERVICENOW_ASSIGNMENT_GROUP || ''; // sys_id of the group
        this.auth = this.username && this.password ? {
            username: this.username,
            password: this.password
        } : null;
        console.log(`[ServiceNow] Config: instance=${this.instanceUrl}, table=${this.tableName}, assignmentGroup=${this.assignmentGroup || 'none'}, enabled=${this.isEnabled()}`);
    }

    isEnabled() {
        return !!(this.instanceUrl && this.auth);
    }

    /**
     * Build the API URL for a given table and optional sys_id
     */
    _url(sysId) {
        const base = `${this.instanceUrl}/api/now/table/${this.tableName}`;
        return sysId ? `${base}/${sysId}` : base;
    }

    /**
     * Build field name with optional prefix
     */
    _field(name) {
        const prefix = process.env.SERVICENOW_FIELD_PREFIX || '';
        return `${prefix}${name}`;
    }

    // ============================
    // TICKET CREATION
    // ============================

    /**
     * Create a new access request ticket in ServiceNow
     * Sets initial state, urgency, assignment, and all relevant fields
     */
    async createTicket(data) {
        if (!this.isEnabled()) {
            console.log('[ServiceNow] Service not configured, returning mock ticket.');
            return { number: `MOCK-SN-${Date.now()}`, sys_id: 'mock', state: 'New' };
        }

        const payload = {};

        // Core fields
        payload[this._field('requester')] = data.requesterEmail;
        payload[this._field('asset_name')] = data.assetName;
        payload[this._field('correlation_id')] = data.requestId;
        payload.short_description = `Dataplex Access Request: ${data.assetName}`;
        payload.description = [
            `Requester: ${data.requesterEmail}`,
            `Asset: ${data.assetName}`,
            `Asset Type: ${data.assetType || 'BigQuery Table'}`,
            `Project: ${data.projectId || 'N/A'}`,
            `Justification: ${data.message || 'No justification provided'}`,
            ``,
            `Submitted via Dataplex Business UI`
        ].join('\n');

        // Workflow fields
        payload.state = SN_STATES.AWAITING_APPROVAL;
        payload.urgency = SN_URGENCY.MEDIUM;

        // Assignment
        if (this.assignmentGroup) {
            payload.assignment_group = this.assignmentGroup;
        }

        // If specific approver emails are provided, set as work notes
        if (data.projectAdmin && data.projectAdmin.length > 0) {
            payload.work_notes = `Data Stewards to approve: ${data.projectAdmin.join(', ')}`;
        }

        console.log('[ServiceNow] Creating ticket:', {
            table: this.tableName,
            url: this._url(),
            state: 'Awaiting Approval',
            hasAssignmentGroup: !!this.assignmentGroup,
            fields: Object.keys(payload)
        });

        try {
            const response = await axios.post(this._url(), payload, {
                auth: this.auth,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
            });

            const result = response.data.result;
            console.log('[ServiceNow] Ticket created:', result.number, 'sys_id:', result.sys_id);

            return {
                number: result.number,
                sys_id: result.sys_id,
                state: SN_STATE_LABELS[result.state] || result.state,
                link: `${this.instanceUrl}/nav_to.do?uri=${this.tableName}.do?sys_id=${result.sys_id}`
            };
        } catch (error) {
            console.error('[ServiceNow] Error creating ticket:', error.message);
            if (error.response) {
                console.error('[ServiceNow] Status:', error.response.status);
                console.error('[ServiceNow] Response:', JSON.stringify(error.response.data, null, 2));
            }
            return { number: 'ERROR-CREATING-SN', sys_id: 'error', state: 'Error' };
        }
    }

    // ============================
    // TICKET STATE UPDATES
    // ============================

    /**
     * Update ticket state and add a work note explaining the change
     */
    async updateTicketState(sysId, newState, workNote) {
        if (!this.isEnabled() || sysId === 'mock' || sysId === 'error') return null;

        const payload = { state: newState };
        if (workNote) {
            payload.work_notes = workNote;
        }

        try {
            const response = await axios.patch(this._url(sysId), payload, {
                auth: this.auth,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
            });
            console.log(`[ServiceNow] Ticket ${sysId} updated to state: ${SN_STATE_LABELS[newState] || newState}`);
            return response.data.result;
        } catch (error) {
            console.error(`[ServiceNow] Error updating ticket ${sysId}:`, error.message);
            return null;
        }
    }

    /**
     * Mark ticket as Approved — called when dual-approval consensus is reached
     */
    async approveTicket(sysId, approverEmail) {
        return this.updateTicketState(
            sysId,
            SN_STATES.APPROVED,
            `Access APPROVED by ${approverEmail}. IAM access has been provisioned.`
        );
    }

    /**
     * Mark ticket as partially approved — called when first approver signs off
     */
    async partialApproveTicket(sysId, approverEmail, currentCount, threshold) {
        return this.updateTicketState(
            sysId,
            SN_STATES.IN_PROGRESS,
            `Partial approval (${currentCount}/${threshold}) by ${approverEmail}. Waiting for additional approval.`
        );
    }

    /**
     * Mark ticket as Rejected
     */
    async rejectTicket(sysId, reviewerEmail, reason) {
        return this.updateTicketState(
            sysId,
            SN_STATES.REJECTED,
            `Access REJECTED by ${reviewerEmail}.${reason ? ' Reason: ' + reason : ''}`
        );
    }

    /**
     * Mark ticket as Closed (after revocation or completion)
     */
    async closeTicket(sysId, closedBy, reason) {
        return this.updateTicketState(
            sysId,
            SN_STATES.CLOSED,
            `Ticket closed by ${closedBy}.${reason ? ' Reason: ' + reason : ''}`
        );
    }

    /**
     * Mark ticket as Cancelled
     */
    async cancelTicket(sysId, cancelledBy) {
        return this.updateTicketState(
            sysId,
            SN_STATES.CANCELLED,
            `Request cancelled by ${cancelledBy}.`
        );
    }

    // ============================
    // COMMENTS & WORK NOTES
    // ============================

    /**
     * Add a visible comment to the ticket (visible to requester)
     */
    async addComment(sysId, comment) {
        if (!this.isEnabled() || sysId === 'mock' || sysId === 'error') return;

        try {
            await axios.patch(this._url(sysId), { comments: comment }, {
                auth: this.auth,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
            });
            console.log(`[ServiceNow] Comment added to ${sysId}`);
        } catch (error) {
            console.error('[ServiceNow] Error adding comment:', error.message);
        }
    }

    /**
     * Add a work note (internal, not visible to requester)
     */
    async addWorkNote(sysId, note) {
        if (!this.isEnabled() || sysId === 'mock' || sysId === 'error') return;

        try {
            await axios.patch(this._url(sysId), { work_notes: note }, {
                auth: this.auth,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }
            });
        } catch (error) {
            console.error('[ServiceNow] Error adding work note:', error.message);
        }
    }

    // ============================
    // TICKET QUERIES
    // ============================

    /**
     * Get a single ticket by sys_id
     */
    async getTicket(sysId) {
        if (!this.isEnabled() || sysId === 'mock' || sysId === 'error') {
            return { state: 'Unknown', number: sysId };
        }

        try {
            const response = await axios.get(this._url(sysId), {
                auth: this.auth,
                headers: { 'Accept': 'application/json' }
            });

            const result = response.data.result;
            return {
                sys_id: result.sys_id,
                number: result.number,
                state: SN_STATE_LABELS[result.state] || result.state,
                stateCode: result.state,
                short_description: result.short_description,
                assigned_to: result.assigned_to?.display_value || result.assigned_to || '',
                assignment_group: result.assignment_group?.display_value || result.assignment_group || '',
                comments: result.comments || '',
                work_notes: result.work_notes || '',
                updated_on: result.sys_updated_on,
                created_on: result.sys_created_on,
                link: `${this.instanceUrl}/nav_to.do?uri=${this.tableName}.do?sys_id=${result.sys_id}`
            };
        } catch (error) {
            console.error(`[ServiceNow] Error fetching ticket ${sysId}:`, error.message);
            return null;
        }
    }

    /**
     * Get a ticket by its correlation_id (our internal requestId)
     */
    async getTicketByCorrelationId(requestId) {
        if (!this.isEnabled()) return null;

        try {
            const response = await axios.get(this._url(), {
                auth: this.auth,
                headers: { 'Accept': 'application/json' },
                params: {
                    sysparm_query: `${this._field('correlation_id')}=${requestId}`,
                    sysparm_limit: 1
                }
            });

            const results = response.data.result;
            if (results && results.length > 0) {
                const result = results[0];
                return {
                    sys_id: result.sys_id,
                    number: result.number,
                    state: SN_STATE_LABELS[result.state] || result.state,
                    stateCode: result.state,
                    link: `${this.instanceUrl}/nav_to.do?uri=${this.tableName}.do?sys_id=${result.sys_id}`
                };
            }
            return null;
        } catch (error) {
            console.error(`[ServiceNow] Error querying by correlation_id ${requestId}:`, error.message);
            return null;
        }
    }

    /**
     * Get all open tickets (for dashboard/monitoring)
     */
    async getOpenTickets() {
        if (!this.isEnabled()) return [];

        try {
            const response = await axios.get(this._url(), {
                auth: this.auth,
                headers: { 'Accept': 'application/json' },
                params: {
                    sysparm_query: `stateNOT IN${SN_STATES.CLOSED},${SN_STATES.CANCELLED},${SN_STATES.REJECTED}`,
                    sysparm_limit: 100,
                    sysparm_fields: 'sys_id,number,short_description,state,assignment_group,assigned_to,sys_created_on,sys_updated_on,' + this._field('requester') + ',' + this._field('asset_name') + ',' + this._field('correlation_id')
                }
            });

            return (response.data.result || []).map(r => ({
                sys_id: r.sys_id,
                number: r.number,
                short_description: r.short_description,
                state: SN_STATE_LABELS[r.state] || r.state,
                stateCode: r.state,
                requester: r[this._field('requester')] || '',
                asset_name: r[this._field('asset_name')] || '',
                correlation_id: r[this._field('correlation_id')] || '',
                assigned_to: r.assigned_to?.display_value || '',
                created_on: r.sys_created_on,
                updated_on: r.sys_updated_on,
                link: `${this.instanceUrl}/nav_to.do?uri=${this.tableName}.do?sys_id=${r.sys_id}`
            }));
        } catch (error) {
            console.error('[ServiceNow] Error fetching open tickets:', error.message);
            return [];
        }
    }

    // ============================
    // WEBHOOK VALIDATION
    // ============================

    /**
     * Validate an incoming webhook from ServiceNow
     * ServiceNow can send a shared secret in the header for basic auth
     */
    validateWebhook(req) {
        if (!this.webhookSecret) return true; // No secret configured = accept all
        const headerSecret = req.headers['x-servicenow-secret'] || req.headers['x-sn-webhook-secret'];
        return headerSecret === this.webhookSecret;
    }

    /**
     * Parse a webhook payload from ServiceNow into a normalized format
     */
    parseWebhookPayload(body) {
        return {
            sysId: body.sys_id,
            number: body.number,
            state: SN_STATE_LABELS[body.state] || body.state,
            stateCode: body.state,
            correlationId: body[this._field('correlation_id')] || body.correlation_id,
            updatedBy: body.sys_updated_by || body.updated_by,
            comments: body.comments || '',
            workNotes: body.work_notes || ''
        };
    }
}

// Export singleton + constants for use in other modules
const serviceNowService = new ServiceNowService();
module.exports = serviceNowService;
module.exports.SN_STATES = SN_STATES;
module.exports.SN_STATE_LABELS = SN_STATE_LABELS;
