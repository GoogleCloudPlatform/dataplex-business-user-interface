const rawUrl = import.meta.env.VITE_API_URL;
const rawVersion = import.meta.env.VITE_API_VERSION;

const sanitize = (val: string | undefined, fallback: string) => {
    // Aggressively catch "undefined", "null", or anything starting with "undefined/" or "__VITE_"
    if (!val ||
        val === 'undefined' ||
        val === 'null' ||
        val.startsWith('undefined/') ||
        val.startsWith('null/') ||
        val.includes('__VITE_')) {
        return fallback;
    }
    return val.trim();
};

const API_BASE_URL = sanitize(rawUrl, '');
const API_VERSION = sanitize(rawVersion, 'v1');

// If API_BASE_URL is empty or relative, ensure it starts with /api
const finalBase = API_BASE_URL || '/api';

console.log(`[URLS] Constructed API_URL: ${finalBase}/${API_VERSION}`);

export const URLS = {
    API_URL: finalBase + '/' + API_VERSION,
    APP_CONFIG: '/app-configs',
    ADMIN_CONFIGURE: '/admin/configure',
    CHECK_IAM_ROLE: '/check-iam-role',
    SEARCH: '/search',
    AI_SEARCH: '/ai-search',
    GET_ENTRY: '/get-entry',
    GET_ENTRY_BY_FQN: '/get-entry-by-fqn',
    GET_SAMPLE_DATA: '/get-sample-data',
    BATCH_ASPECTS: '/batch-aspects',
    LINEAGE_SEARCH: '/lineage',
    ENTRY_DATA_QUALITY: '/entry-data-quality',
    GET_DATA_SCAN: '/get-data-scan',
    GET_ALL_DATA_SCANS: '/data-scans',
    GET_ASPECT_DETAIL: '/get-aspect-detail',
    GET_PROCESS_AND_JOB_DETAILS: '/get-process-and-job-details',
    ACCESS_REQUEST: '/access-request',
    GET_PROJECTS: '/get-projects',
    SEND_FEEDBACK: '/send-feedback',
    CHAT: '/chat',
    ACCESSIBLE_TABLES: '/accessible-tables',
    GET_ASPECT: '/aspect',
    GET_ACCESS_REQUESTS: '/access-requests',
    UPDATE_ACCESS_REQUEST: '/access-request/update',
    GET_ASPECT_TYPES: '/aspect-types',
    UPDATE_ENTRY_ASPECTS: '/update-entry-aspects',
    LINEAGE_SEARCH_COLUMN_LEVEL: '/lineage-column-level',
    DATASET_RELATIONSHIPS: '/dataset-relationships',
    CHECK_ENTRY_ACCESS: '/check-entry-access',
    GET_SCAN_JOBS: '/get-data-scan-jobs',

    // ServiceNow
    SERVICENOW_TICKET_STATUS: '/servicenow/ticket', // + /:requestId
    SERVICENOW_OPEN_TICKETS: '/servicenow/open-tickets',

    // Admin Role Management
    ADMIN_CHECK: '/admin/check',
    ADMIN_ROLES: '/admin/roles',
    ADMIN_PROJECT_ADMINS: '/admin/project-admins',

    // Access Management
    GRANTED_ACCESSES: '/access/granted',
    ACCESS_BY_ASSET: '/access/asset',
    REVOKE_ACCESS: '/access/revoke',
    BULK_APPROVE: '/access/bulk-approve',
    BULK_REJECT: '/access/bulk-reject',
    ACCESS_STATS: '/access/stats',

    // Data Products
    CREATE_DATA_PRODUCT: '/data-products',
    ADD_DATA_PRODUCT_ASSETS: '/data-products/assets',
    ENTRIES_BY_LOCATION: '/entries-by-location',

    // Notifications
    NOTIFICATIONS: '/notifications',
    NOTIFICATIONS_UNREAD_COUNT: '/notifications/unread-count',
    NOTIFICATIONS_MARK_READ: '/notifications/mark-read',
    NOTIFICATIONS_MARK_ALL_READ: '/notifications/mark-all-read',
}