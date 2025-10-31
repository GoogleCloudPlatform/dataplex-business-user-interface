import React, { useState } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  List,
  ListItem,
  Link,
  Divider,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArticleIcon from '@mui/icons-material/Article';

interface GuideSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

const deploymentScript = `# Step 1: Authenticate to Cloud shell or Google Cloud SDK
# Login with the account in which you have access of the project for deployment

gcloud auth login

# Step 2: Set the project in which you are going to deploy this application
# Replace YOUR_PROJECT_ID with the actuall Project id in the below command before running it

gcloud config set project YOUR_PROJECT_ID

# Step 3: Enable Cloud run and artifact API's for deployment
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com

# Step 4: Clone the repo into you Cloud shell or in case of Google cloud SDK clone it into the installed computer

git clone https://github.com/link-to-this-repo-for-clonning

# After clonning go inside the clonned repo

cd dataplex-buisness-user-ui

# Now before building the container if we want to do any default configs setting for ui change we can do that via changing the configData.json inside the backend folder check the readme file to see how to do this. 
vi backend/configData.json // or use any code/text editor

# Step 5: Create the artifact repository to store the container artifact, this command require to run only once for the deployment if you are re-deplying skip this step

# Replace \`[REPO_NAME]\` with the name you want to give like (dataplex-buisness-ui-artifact, etc.) and set up your preferred region by setting that in --location flag below command is using \`us-central1\` but you can replace it but make sure if you replace it then use the same region in below steps by replacing \`us-central1\` with the the used value.

gcloud artifacts repositories create \`[REPO_NAME]\` --repository-format=docker --location=us-central1 --description="Docker repository for dataplex-buisness-ui project"

# Step 6 Build the Docker Image with Cloud Build
# Submit your project to Google Cloud Build to create a container image. Replace \`[PROJECT_ID]\`with your GCP Project ID,\`[REPO_NAME]\` which you created in the step 5 and \`[APP_NAME]\`with your desired application name.

gcloud builds submit . --tag us-central1-docker.pkg.dev/[PROJECT_ID]/[REPO_NAME]/[APP_NAME]:latest

# Step 7: Deploy to Cloud Run
# Replace the [PROJECT_ID],[REPO_NAME],[APP_NAME] with the value you have used above and replace [SERVICE_NAME] with the name you want to set your cloud run service, [ADMIN_EMAIL_ID] to your admin email you want to set, then the most important replace the [CLIENT_ID] and [CLIENT_SCERET] with the OAuth credentials you created in earlier steps.

# Deploy the container image you just built to Cloud Run using the below command after replacing the mentioned values.

gcloud run deploy [SERVICE_NAME] \
--image us-central1-docker.pkg.dev/[PROJECT_ID]/[REPO_NAME]/[APP_NAME]:latest \
--platform managed \
--region us-central1 \
--allow-unauthenticated \
--port 8080 \
--set-env-vars  VITE_API_URL="/api" \
--set-env-vars  VITE_API_VERSION="v1" \
--set-env-vars  VITE_ADMIN_EMAIL="[ADMIN_EMAIL_ID]" \
--set-env-vars  VITE_GOOGLE_PROJECT_ID="[PROJECT_ID]" \
--set-env-vars  VITE_GOOGLE_CLIENT_ID="[CLIENT_ID]" \
--set-env-vars  VITE_GOOGLE_REDIRECT_URI="/auth/google/callback" \
--set-env-vars  GOOGLE_CLOUD_PROJECT_ID="[PROJECT_ID]" \
--set-env-vars  GCP_LOCATION="global" \
--set-env-vars  GCP_REGION="global" \
--set-env-vars  VITE_GOOGLE_CLIENT_SECRET="[CLIENT_SCERET]"

# After successfull deployment it will return a url to access the application.

# Step 8: Update OAuth Credentials for Production
# Go back to your Google Cloud Console > Credentials page.

# Edit your Web application client ID.

# Add the URL provided by Cloud Run (e.g., https://your-app-name-....run.app) to the Authorized JavaScript origins and Authorized redirect URIs.

# Save your changes.
              `;

const UserGuide: React.FC = () => {
  const handleChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };
  const handleNavClick = (
  event: React.MouseEvent<HTMLAnchorElement>,
  sectionId: string
) => {
  event.preventDefault();

  setExpanded((prevExpanded) => (prevExpanded === sectionId ? false : sectionId));

  setTimeout(() => {
    const element = document.getElementById(sectionId);
    if (element) {
      const navbarHeight = 80; 
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  }, 100);
};

  const codeBlockBaseStyles = {
    backgroundColor: '#efefef',
    borderRadius: '4px',
    overflowX: 'auto',
    fontSize: '0.875rem',
    fontFamily: '"Roboto Mono", monospace',
    color: '#006400',
    whiteSpace: 'pre',
    padding: '12px',
    mt: 1,
  };

  const guideSections: GuideSection[] = [
  {
    id: 'preview-disclaimer',
    title: 'Preview Disclaimer',
    content: (
      <Box sx={{ color: '#193c98' }}>
        <Typography paragraph sx={{ color: 'inherit' }}>
          This is a preview launch of a feature.
        </Typography>
        <Typography paragraph sx={{ color: 'inherit' }}>
          We strongly recommend that for this preview you set up or use only non-production projects 
          that are dedicated solely for the purpose of testing the features under this Preview.
        </Typography>
        <Typography paragraph sx={{ color: 'inherit' }}>
          This feature and its API may be changed in backward-incompatible ways and are not subject to any SLA.
        </Typography>
      </Box>
    ),
  },
  {
    id: 'overview',
    title: 'Overview',
    content: (
      <>
        <Typography paragraph>
          Dataplex Business Interface is an open source, web-based application designed to give your
          business teams the ability to easily discover, understand, and request access to your
          organization's data assets.
        </Typography>
        <Typography paragraph>
          We recognize that many business users don't require or have access to the full Google Cloud
          Platform (GCP) Console. This application eliminates that barrier by providing a streamlined,
          external interface that works directly with your data catalog in <Link
                href="https://cloud.google.com/dataplex?e=48754805&hl=en" 
                target="_blank"
                rel="noopener"
                sx={{ color: '#26428b', textDecoration: 'underline' }}
              >Dataplex Universal Catalog</Link>.
        </Typography>
        <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2 }}>
          Key Benefits
        </Typography>
        <ul>
          <li>
            <Typography>
              <strong>Simplified Access:</strong> Quickly discover relevant data without the
              need to navigate the technical complexities.
            </Typography>
          </li>
          <li>
            <Typography>
              <strong>Centralized Discovery:</strong> Search across all your data assets in Dataplex, including data
              from BigQuery, Cloud Spanner, Cloud SQL and more.
            </Typography>
          </li>
          <li>
            <Typography>
              <strong>Comprehensive Metadata:</strong> Easily view details like data definitions, lineage, and
              sensitivity, and initiate a formal access request when you need permission to use an
              asset.
            </Typography>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'architecture',
    title: 'Dataplex Business Interface: Architecture',
    content: (
      <>
        <Typography paragraph>
          The Dataplex Business Interface is designed to be a secure and fast web-application for your
          catalog search experience outside of Google Cloud.
          This diagram illustrates how the components work together to ensure a secure, user-friendly
          experience.
        </Typography>
        <Box
          component="img"
          src="/assets/images/fig1-architecture.png"
          alt="Dataplex Business Interface high-level architecture"
          sx={{ width: '100%', border: '1px solid #ddd', borderRadius: '4px', my: 2 }}
        />
        <Typography variant="caption" display="block" gutterBottom sx={{ textAlign: 'center' }}>
          Fig 1. High-level Architecture
        </Typography>
      </>
    ),
  },
  {
    id: 'api-usage',
    title: 'API Usage Details',
    content: (
      <>
        <Typography paragraph>
          The application uses specific Google Cloud APIs to power your discovery experience:
        </Typography>
        <ul>
          <li>
            <Typography>
              <strong>Dataplex Catalog Search API:</strong> These are the primary engine, allowing the application
              to quickly query metadata across assets using keywords, tags, descriptions, and
              filtering criteria.
            </Typography>
          </li>
          <li>
            <Typography>
              <strong>Dataplex Entity/Entry API:</strong> Used to retrieve detailed information, such as schemas,
              data owners, lineage, and creation times, when you click on a specific data asset.
            </Typography>
          </li>
          <li>
            <Typography>
              <strong>Data Lineage API:</strong> Used to retrieve data lineage information for the assets.
            </Typography>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'before-you-begin',
    title: 'Before You Begin',
    content: (
      <>
        <Typography paragraph>
          The Dataplex Business Interface functions by interacting with Google Cloud APIs. For the
          application to work, below prerequisites must be met by both the deployment administrator
          and the end-user.
        </Typography>

        <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2 }}>
          Deployment Prerequisites
        </Typography>
        <Typography paragraph>
          For you to successfully deploy the application, you need to have these with you:
        </Typography>
        <ul>
          <li><Typography>Your project should have the billing enabled.</Typography></li>
          <li><Typography>You should have access to cloud shell, cloud run, and api enable permissions in the project.</Typography></li>
          <li><Typography>Assumption that dataplex api is enabled and you have sufficient permissions.</Typography></li>
          <li><Typography> <Link
                href="https://developers.google.com/identity/protocols/oauth2" 
                target="_blank"
                rel="noopener"
                sx={{ color: '#26428b', textDecoration: 'underline' }}
              >Create an OAuth client using google auth platform</Link> as it is used for authentication. In this step you would get client id and secret note, you will be needing that in deployment.</Typography></li>
        </ul>

        <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2 }}>
          Authentication Prerequisites
        </Typography>
        <Typography paragraph>
          To ensure successful integration and utilization of Dataplex and BigQuery APIs (specifically for
          retrieving metadata), the associated <strong>GCP Identity</strong> (User Principal) must be granted the
          necessary Identity and Access Management (IAM) permissions. The application enforces
          and validates these permissions during the connection process via <strong>Cloud OAuth 2.0 authorization</strong>.
        </Typography>
        <Typography paragraph sx={{ fontWeight: 'bold' }}>
          Minimum Required Permissions:
        </Typography>
        <Typography paragraph>
          Your GCP administrator must provision the identity with, at a minimum:
        </Typography>
        <ul>
          <li><Typography><strong>GCP Viewer role:</strong> Grants necessary read/get access to generic resources to <Typography component="code" sx={{ color: '#006400', fontWeight: 'bold', fontFamily: 'monospace', padding: '2px 4px', borderRadius: '4px' }}>roles/viewer</Typography>.</Typography></li>
          <li><Typography><strong>Dataplex Viewer role:</strong> Grants necessary read/get access to Dataplex resources <Typography component="code" sx={{ color: '#006400', fontWeight: 'bold', fontFamily: 'monospace', padding: '2px 4px', borderRadius: '4px' }}>roles/dataplex.viewer</Typography>.</Typography></li>
          <li><Typography>The specific permission: <Typography component="code" sx={{ color: '#006400', fontWeight: 'bold', fontFamily: 'monospace', padding: '2px 4px', borderRadius: '4px' }}>bigquery.tables.get</Typography> (required for retrieving BigQuery table metadata).</Typography></li>
        </ul>
      </>
    ),
  },
  {
    id: 'deploy',
    title: 'Deploy Dataplex Business Interface Application',
    content: (
      <>
        <Typography paragraph>
          This application is an open-source solution that must be deployed within your organization's
          cloud environment. The deployment process is handled by a technical administrator, but these
          steps outline the accepted deployment methods. The solution is designed to be deployed on
          GCP's Cloud Run for simplicity and scalability.
        </Typography>
        <Typography paragraph>
          The core administrative requirements during deployment include:
        </Typography>
        <ul>
          <li><Typography>Enabling the necessary GCP APIs (<strong>Dataplex API, BigQuery API</strong>, etc).</Typography></li>
          <li><Typography>Generating and configuring the required API keys and service accounts.</Typography></li>
          <li><Typography>Setting up the application container and Cloud Run deployment environment.</Typography></li>
        </ul>

        <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2 }}>
          Deployment Methods (For Administrator Reference)
        </Typography>
        <Typography component="div">
          Methods described:
        </Typography>
        <ul>
          <li>
            <Typography><strong>Console:</strong> Administrators can use the GCP Cloud Run console interface to create the service, configure environment variables for API keys, and deploy the application container image.</Typography>
          </li>
          <li>
            <Typography><strong>gcloud CLI:</strong> This involves multiple steps:</Typography>
            <ul>
              <li><Typography><strong>Create Configuration Files:</strong> The administrator must first create a Dockerfile and an nginx.conf file in the project's root directory. The Dockerfile details how to build the application and serve the static files with Nginx, and the nginx.conf is necessary to handle Single-Page Application (SPA) routing.</Typography></li>
              <li><Typography><strong>Build Container Image:</strong> Using the gcloud builds submit command, the project is submitted to Google Cloud Build. This process creates a container image and tags it for storage in the Google Container Registry.</Typography></li>
              <li><Typography><strong>Deploy to Cloud Run:</strong> The administrator then uses the gcloud run deploy command. This command deploys the container image built in the previous step to the fully managed Cloud Run environment, making the application accessible via a public URL.</Typography></li>
              <li><Typography><strong>Update OAuth Credentials:</strong> Finally, the administrator must go back to the Google Cloud Console. They need to edit the existing Web application client ID to add the new public URL provided by Cloud Run to the Authorized JavaScript origins and Authorized redirect URIs lists.</Typography></li>
            </ul>
          </li>
          <li>
            <Typography>
              <strong>Script:</strong> For the complete, step-by-step deployment procedure, please refer to the
              project repository's <Typography component="code" sx={{ color: '#006400', fontWeight: 'bold', fontFamily: 'monospace', padding: '2px 4px', borderRadius: '4px' }}>README.md</Typography> file under the section titled <strong>'Cloud Run Deployment for Production'</strong>.
            </Typography>
            <Typography sx={{ mt: 1 }}>Example script steps:</Typography>
          <Box sx={{ position: 'relative', mt: 1 }}>
              <Box
                component="pre"
                sx={codeBlockBaseStyles}
              >
                {deploymentScript}
              </Box>
            </Box>
          <Divider sx={{ my: 3 }} />

            <Typography variant="h6" component="div" sx={{ mt: 2, mb: 1 }}>
              For re-deployment follow the steps below
            </Typography>

            <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2, fontSize: '1.1rem' }}>
              Step 1: Pull the latest changes from the code repository
            </Typography>
            <Typography paragraph>
              if you want to redeploy the changes with the latest codes. Go to the repository folder inside the cloud shell and run the command below.
            </Typography>
            {/* --- git pull --- */}
            <Box sx={{ position: 'relative', mt: 1 }}>
              <Box component="pre" sx={codeBlockBaseStyles}>
                {`git pull`}
              </Box>
            </Box>

            <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2, fontSize: '1.1rem' }}>
              Step 2: Modify the backend/configData.json if required
            </Typography>
            <Typography paragraph>
              if you want any changes in your backend/configData.json for the browse experience, you can do so or if you don't want the changes in that use the same file. for modificatio of the configData.json file run the command below.
            </Typography>
            {/* --- vi backend/configData.json --- */}
            <Box sx={{ position: 'relative', mt: 1 }}>
              <Box component="pre" sx={codeBlockBaseStyles}>
                {`vi backend/configData.json`}
              </Box>
            </Box>

            <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2, fontSize: '1.1rem' }}>
              Step 3: we have to re build the Docker Image with Cloud Build
            </Typography>
            <Typography paragraph>
              Submit your project to Google Cloud Build to create a container image. Replace [PROJECT_ID]with your GCP Project ID, [REPO_NAME] which you created in the step 5 and [APP_NAME]with your desired application name.
            </Typography>
            {/* --- gcloud builds submit... --- */}
            <Box sx={{ position: 'relative', mt: 1 }}>
              <Box component="pre" sx={codeBlockBaseStyles}>
                {`gcloud builds submit . --tag us-central1-docker.pkg.dev/[PROJECT_ID]/[REPO_NAME]/[APP_NAME]:latest`}
              </Box>
            </Box>

            <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2, fontSize: '1.1rem' }}>
              Step 4: Deploy to Cloud Run
            </Typography>
            <Typography paragraph>
              Replace the [PROJECT_ID],[REPO_NAME],[APP_NAME] with the value you have used above and replace [SERVICE_NAME] with the name you want to set your cloud run service, [ADMIN_EMAIL_ID] to your admin email you want to set, then the most important replace the [CLIENT_ID] and [CLIENT_SCERET] with the OAuth credentials you created in earlier steps.
              Deploy the container image you just built to Cloud Run using the below command after replacing the mentioned values. After successfull deployment it will return a url to access the application.
            </Typography>
            {/* --- gcloud run deploy... --- */}
            <Box sx={{ position: 'relative', mt: 1 }}>
              <Box component="pre" sx={codeBlockBaseStyles}>
                {`gcloud run deploy [SERVICE_NAME] \\
  --image us-central1-docker.pkg.dev/[PROJECT_ID]/[REPO_NAME]/[APP_NAME]:latest \\
  --platform managed \\
  --region us-central1 \\
  --allow-unauthenticated \\
  --port 8080 \\
  --set-env-vars  VITE_API_URL="/api" \\
  --set-env-vars  VITE_API_VERSION="v1" \\
  --set-env-vars  VITE_ADMIN_EMAIL="[ADMIN_EMAIL_ID]" \\
  --set-env-vars  VITE_GOOGLE_PROJECT_ID="[PROJECT_ID]" \\
  --set-env-vars  VITE_GOOGLE_CLIENT_ID="[CLIENT_ID]" \\
  --set-env-vars  VITE_GOOGLE_REDIRECT_URI="/auth/google/callback" \\
  --set-env-vars  GOOGLE_CLOUD_PROJECT_ID="[PROJECT_ID]" \\
  --set-env-vars  GCP_LOCATION="global" \\
  --set-env-vars  GCP_REGION="global" \\
  --set-env-vars  VITE_GOOGLE_CLIENT_SECRET="[CLIENT_SCERET]"`}
              </Box>
            </Box>

            <Typography paragraph sx={{ mt: 2 }}>
              Your application is now redeployed and accessible, with both front-end and backend in one single container and cloud run service!
            </Typography>
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'authenticate',
    title: 'Authenticate',
    content: (
      <>
        <Typography paragraph>
          Accessing the Dataplex Business Interface is a straightforward, two-step process to ensure
          security and permission compliance.
        </Typography>
        <ol>
          <li>
            <Typography>
              <strong>Access the Web App:</strong> Navigate to the specific URL provided by your organization's
              administrator.
            </Typography>
          </li>
          <li>
            <Typography>
              <strong>Google Cloud Sign-In:</strong> You will be prompted to log in using your standard Google
              Cloud login and password. The application uses OAuth 2.0 for this secure sign-in
              process.
            </Typography>
          </li>
          <li>
            <Typography>
              <strong>Permission Check:</strong> Once logged in, the application verifies your assigned Dataplex
              permissions. If you have the required roles, you are redirected to the Home Page. If
              permissions are missing, you will receive a message to contact your administrator.
            </Typography>
          </li>
        </ol>
        <Box
          component="img"
          src="/assets/images/fig2-signin.png"
          alt="Dataplex Business Interface Sign-in Page"
          sx={{ width: '100%', border: '1px solid #ddd', borderRadius: '4px', my: 2 }}
        />
        <Typography variant="caption" display="block" gutterBottom sx={{ textAlign: 'center' }}>
          Fig 2. Sign-in Page
        </Typography>
      </>
    ),
  },
  {
    id: 'search',
    title: 'Search Data Assets',
    content: (
      <>
        <Typography paragraph>
          Upon successful authentication, the Home Page is your central hub for data discovery.
        </Typography>
        <Box
          component="img"
          src="/assets/images/fig3-homepage.png"
          alt="Dataplex Business Interface Home Page"
          sx={{ width: '100%', border: '1px solid #ddd', borderRadius: '4px', my: 2 }}
        />
        <Typography variant="caption" display="block" gutterBottom sx={{ textAlign: 'center' }}>
          Fig 3. Home Page
        </Typography>

        <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2 }}>
          Home Page Features
        </Typography>
        <ul>
          <li><Typography><strong>Search Bar:</strong> The primary tool for finding data using keywords or asset names.</Typography></li>
          <li><Typography><strong>Browse:</strong> The browse link allows users to directly search for and locate assets associated with the selected aspect.</Typography></li>
        </ul>
        <Box
          component="img"
          src="/assets/images/fig4-searchbar.png"
          alt="Dataplex search bar with asset type dropdown"
          sx={{ width: '100%', border: '1px solid #ddd', borderRadius: '4px', my: 2 }}
        />
        <Typography variant="caption" display="block" gutterBottom sx={{ textAlign: 'center' }}>
          Fig 4. Option to select - All Assets or BigQuery
        </Typography>

        <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2 }}>
          How to Search
        </Typography>
        <Typography paragraph>
          The search function allows you to quickly narrow down the data catalog to the assets that are
          relevant to your task.
        </Typography>
          <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2 }}>1. Enter Keywords:</Typography> <Typography paragraph>Type the asset name, relevant keywords, tags, or parts of the
          description into the search bar.</Typography>
        <Box
          component="img"
          src="/assets/images/fig5-search-results.png"
          alt="Dataplex search results page for 'sale'"
          sx={{ width: '100%', border: '1px solid #ddd', borderRadius: '4px', my: 2 }}
        />
        <Typography variant="caption" display="block" gutterBottom sx={{ textAlign: 'center' }}>
          Fig 5. Search for assets
        </Typography>

        <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2 }}>
          2. Filters for Business Interface
        </Typography>
        <Typography paragraph>
          Filters are available to help you quickly narrow down the
          results of your search by applying specific criteria.
        </Typography>
        <Typography paragraph>
          Following are the available filter types:
        </Typography>
        <ul>
          <li>
            <Typography><strong>Aspects:</strong> The <strong>Aspect</strong> filter allows you to refine search results based on the metadata and tags that have been applied to data assets, often by Data Stewards. These tags provide critical context, helping you quickly understand the nature of the data before viewing the details. For example, you can filter by:
</Typography>
            <ul>
              <li><Typography>Data Quality: Show only assets that have been tagged as meeting
                specific quality standards.</Typography></li>
              <li><Typography>Data Governance: Filter for assets that carry specific governance labels,
                such as a particular sensitivity level.</Typography></li>
            </ul>
            <Box
              component="img"
              src="/assets/images/fig6-filter-aspect.png"
              alt="Dataplex search results with Aspect filter highlighted"
              sx={{ width: '100%', border: '1px solid #ddd', borderRadius: '4px', my: 2 }}
            />
            <Typography variant="caption" display="block" gutterBottom sx={{ textAlign: 'center' }}>
              Fig 6. Filter on Aspect
            </Typography>
          </li>
          <li>
            <Typography><strong>Assets:</strong> The <strong>Assets</strong> filter allows you to narrow your search based on the type of data resource itself. This is useful when you are looking for a specific kind of artifact, regardless of which Google Cloud product it came from. The Studio pulls metadata about many asset types. Examples of assets you can filter by include:</Typography>
            <ul>
              <li><Typography>Datasets: BigQuery datasets.</Typography></li>
              <li><Typography>Code asset: Code files or scripts related to data transformation.</Typography></li>
            </ul>
            <Box
              component="img"
              src="/assets/images/fig7-filter-assets.png"
              alt="Dataplex search results with Assets filter highlighted"
              sx={{ width: '100%', border: '1px solid #ddd', borderRadius: '4px', my: 2 }}
            />
            <Typography variant="caption" display="block" gutterBottom sx={{ textAlign: 'center' }}>
              Fig 7. Filter on Assets (Bucket, Cluster, Connection, etc)
            </Typography>
          </li>
          <li>
            <Typography><strong>Products:</strong> The <strong>Products</strong> filter allows you to focus your search on data assets originating from a specific Google Cloud service. This helps if you know the general location of the data you are seeking. The Studio centralizes metadata from many sources across your organization's data landscape. Examples of products you can filter by include:</Typography>
            <ul>
              <li><Typography>BigQuery: Data warehouses and datasets.</Typography></li>
              <li><Typography>Cloud Spanner: Highly scalable, globally distributed database instances.</Typography></li>
              <li><Typography>Cloud SQL: Managed relational databases (like MySQL, PostgreSQL, or SQL Server).</Typography></li>
            </ul>
            <Box
              component="img"
              src="/assets/images/fig8-filter-products.png"
              alt="Dataplex search results with Products filter highlighted"
              sx={{ width: '100%', border: '1px solid #ddd', borderRadius: '4px', my: 2 }}
            />
            <Typography variant="caption" display="block" gutterBottom sx={{ textAlign: 'center' }}>
              Fig 8. Filter on Products (Analytics Hub, BigQuery, Cloud Spanner, etc)
            </Typography>
          </li>
          <li>
            <Typography><strong>Projects:</strong> The <strong>Projects</strong> filter allows you to limit the displayed results to assets located within one or more specific Google Cloud Projects (Project IDs). Organizations often use different projects to logically separate data environments (e.g., Development, Staging, Production, or different business units). By selecting a Project ID, you can ensure your search is only looking at the assets relevant to that particular environment.</Typography>
            <Box
              component="img"
              src="/assets/images/fig9-filter-projects.png"
              alt="Dataplex search results with Projects filter highlighted"
              sx={{ width: '100%', border: '1px solid #ddd', borderRadius: '4px', my: 2 }}
            />
            <Typography variant="caption" display="block" gutterBottom sx={{ textAlign: 'center' }}>
              Fig 9. Filter on GCP Projects
            </Typography>
          </li>
        </ul>
        <Typography paragraph sx={{ mt: 2 }}>
          <strong>Note on Usage:</strong> All filters are designed to work together, allowing you to multi-select
          options to precisely narrow down the entire catalog to the few assets you need.
        </Typography>

        <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2 }}>
          3. Review At-a-Glance Metadata
        </Typography>
        <Typography paragraph>
          The search results card provides essential information
          immediately so you can assess relevance without opening the detail page.
          This includes:
        </Typography>
        <ul>
          <li><Typography>Asset Name and Type</Typography></li>
          <li><Typography>Option to request access</Typography></li>
          <li><Typography>Overview - Description and other source metadata</Typography></li>
          <li><Typography>Associated GCP Project ID</Typography></li>
          <li><Typography>Schema</Typography></li>
          <li><Typography>aspects</Typography></li>
        </ul>
        <Box
          component="img"
          src="/assets/images/fig10-metadata-preview.png"
          alt="Dataplex search result card and metadata preview pane"
          sx={{ width: '100%', border: '1px solid #ddd', borderRadius: '4px', my: 2 }}
        />
        <Typography variant="caption" display="block" gutterBottom sx={{ textAlign: 'center' }}>
          Fig 10. View metadata for the selected asset
        </Typography>
      </>
    ),
  },
  {
    id: 'detailed-view',
    title: 'Detailed Asset View',
    content: (
      <>
        <Typography paragraph>
          Clicking any asset from the search results takes you to the Detail Page, which provides a comprehensive view of the asset's metadata and context. While the Overview and aspects tabs are present for all assets, the availability of other tabs (like Lineage or Data Quality) may vary depending on the asset's source (e.g., BigQuery, Cloud Spanner, Vertex AI).
        </Typography>
        <Typography paragraph>
          Here is a breakdown of the information found in the main tabs:
        </Typography>

        <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2 }}>
          1. Overview
        </Typography>
        <Typography paragraph>
          This tab provides the foundational facts about the data asset. It is divided into key
          sections:
        </Typography>
        <ul>
          <li><Typography><strong>Details:</strong> Includes the comprehensive description, project ID, data owner contact
            information, and creation/modification times.</Typography></li>
          <li><Typography><strong>Table Info:</strong> If the asset is a structured table (like a BigQuery table), this section
            shows the Schema (column names, data types) and often a small set of Sample
            Data for quick validation.</Typography></li>
          <li><Typography><strong>Documentation:</strong> Links or displays any formal documentation related to the asset.</Typography></li>
        </ul>
        <Typography paragraph>
          You will also find the following core data points:
        </Typography>
        <ul>
          <li><Typography><strong>Contacts:</strong> Identifies the Data Owner or Steward responsible for the asset, enabling you to know exactly who to contact for deeper questions or specific access requests.</Typography></li>
          <li><Typography><strong>Info (Creation Time, Last Modified):</strong> Provides essential timing metadata, showing you when the asset was originally created and when its structure or metadata was last changed.</Typography></li>
          <li><Typography><strong>Usage Metrics:</strong> Offers insights into how active the data asset is. This may include metrics like Total Queries run against the asset, typical Execution Time, or the last Refresh Time to help gauge its current relevance and freshness.</Typography></li>
          <li><Typography><strong>Labels:</strong> Displays organizational tags applied to the asset, often used for billing, security, or environment classification. These help categorize the asset within the broader IT landscape.</Typography></li>
        </ul>
        <Box
          component="img"
          src="/assets/images/fig11-detailed-overview.png"
          alt="Dataplex asset metadata overview tab"
          sx={{ width: '100%', border: '1px solid #ddd', borderRadius: '4px', my: 2 }}
        />
        <Typography variant="caption" display="block" gutterBottom sx={{ textAlign: 'center' }}>
          Fig 11. Metadata for the given asset - includes Overview, aspects, Lineage, Data Profile,
          Data Quality
        </Typography>

        <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2 }}>
          2. Aspects
        </Typography>
        <Typography paragraph>
          This tab displays all the standardized tags and classifications that have been applied to
          the asset. This context helps you understand the asset's sensitivity, regulatory
          compliance status, and general business relevance.
        </Typography>
        <Box
          component="img"
          src="/assets/images/fig12-detailed-aspects.png"
          alt="Dataplex asset metadata aspects tab"
          sx={{ width: '100%', border: '1px solid #ddd', borderRadius: '4px', my: 2 }}
        />
        <Typography variant="caption" display="block" gutterBottom sx={{ textAlign: 'center' }}>
          Fig 12. Metadata for the given asset - aspects
        </Typography>

        <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2 }}>
          3. Lineage
        </Typography>
        <Typography paragraph>
          This tab is available for assets where lineage is enabled. It provides a visual flow of the data, showing you its origin, the transformations it has undergone, and any downstream assets it feeds. This is crucial for tracing data back to its source or understanding its impact.
        </Typography>
        <Box
          component="img"
          src="/assets/images/fig13-detailed-lineage.png"
          alt="Dataplex asset metadata lineage tab"
          sx={{ width: '100%', border: '1px solid #ddd', borderRadius: '4px', my: 2 }}
        />
        <Typography variant="caption" display="block" gutterBottom sx={{ textAlign: 'center' }}>
          Fig 13. Metadata for the given asset - Lineage
        </Typography>

        <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2 }}>
          4. Data Profile
        </Typography>
        <Typography paragraph>
          This tab provides statistical insights into the data asset. It often includes metrics such as
          column value distribution, null value counts, data format consistency, and other
          summaries that describe the shape and completeness of the data.
        </Typography>

        <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2 }}>
          5. Data Quality
        </Typography>
        <Typography paragraph>
          This tab displays the results of any automated quality checks that have been run against
          the asset. It shows the data quality scores and details on which specific quality rules
          (e.g., uniqueness, completeness, validity) the data passes or fails.
        </Typography>
        <Typography variant="h6" gutterBottom component="div" sx={{ mt: 2 }}>
          6. Explore Data in Source or with Looker Studio
        </Typography>
        <Typography paragraph>
          From the detailed asset page, you have options in the top corner to move beyond discovery and begin analysis using external tools, provided you have the necessary permissions:
        </Typography>
        <ul>
          <li><Typography><strong>Explore in Source:</strong> This option typically launches the original GCP product console (e.g., Open in BigQuery or Cloud Spanner) and directs you to the exact data asset. This is essential for users who need to perform technical queries or deeper, in-platform analysis.</Typography></li>
          <li><Typography><strong>Explore with Looker Studio:</strong> This option directly initiates a Looker Studio connection, allowing you to immediately begin building reports, dashboards, or visualizations using the data asset. This streamlines the hand-off from data discovery to business intelligence.</Typography></li>
        </ul>
        <Box
          component="img"
          src="/assets/images/fig14-explore.png"
          alt="Explore options in Dataplex: Open in BigQuery and Explore with Looker Studio"
          sx={{ width: '100%', border: '1px solid #ddd', borderRadius: '4px', my: 2 }}
        />
        <Typography variant="caption" display="block" gutterBottom sx={{ textAlign: 'center' }}>
          Fig 14. Options to explore the data - with Source (BigQuery in this case) and Looker Studio
        </Typography>
      </>
    ),
  },
  {
    id: 'browse-assets',
    title: 'Browse Data Assets',
    content: (
      <>
        <Typography paragraph>
          If you are exploring or are unsure of the exact name of the asset, the Browse function allows
          you to navigate the Catalog using aspects.
        </Typography>
        <Box
          component="img"
          src="/assets/images/fig15-browse-button.png"
          alt="Dataplex home page with Browse button highlighted"
          sx={{ width: '100%', border: '1px solid #ddd', borderRadius: '4px', my: 2 }}
        />
        <Typography variant="caption" display="block" gutterBottom sx={{ textAlign: 'center' }}>
          Fig 15. Click Browse on the Homepage to browse for assets
        </Typography>
        <Typography paragraph>
          Aspects are standardized tags or classifications applied to data assets by Data Stewards to provide critical governance or quality context. This view helps you quickly find data grouped by its business relevance, quality status, or compliance classification.
        </Typography>
        <Typography paragraph>
          When you view the aspects list, you will see two key metrics next to each category:
        </Typography>
        <ul>
          <li>
            <Typography>
              <strong>Field Values:</strong> This number represents the count of specific sub-tags or defined options available within that aspect category. For example, if you see "Data Governance: 10 Field Values," it means there are 10 specific governance labels (like "Highly Sensitive" or "Internal") you can filter by.
            </Typography>
          </li>
          <li>
            <Typography>
              <strong>Assets:</strong> This number indicates the total count of data assets (tables, datasets, etc.) in the catalog that have been tagged with any of the defined Field Values under that primary aspect. Clicking the aspect category will filter your view to show only these relevant assets.
            </Typography>
          </li>
        </ul>
        <Box
          component="img"
          src="/assets/images/fig16-browse-aspects.png"
          alt="Dataplex browse by aspect page"
          sx={{ width: '100%', border: '1px solid #ddd', borderRadius: '4px', my: 2 }}
        />
        <Typography variant="caption" display="block" gutterBottom sx={{ textAlign: 'center' }}>
          Fig 16. Choose an aspect from the catalog
        </Typography>
      </>
    ),
  },
  {
    id: 'request-access',
    title: 'Requesting Access Workflow',
    content: (
      <>
        <Typography paragraph>
          If you find an asset but the status indicates restricted access, follow this process:
        </Typography>
        <ol>
          <li><Typography><strong>Acknowledge Restricted Status:</strong> The asset view will clearly show you that you do not
            have permission to use the data.</Typography></li>
          <li><Typography><strong>Initiate Request:</strong> Click the <strong>Request Access</strong> button.</Typography></li>
          <li><Typography><strong>Provide Justification:</strong> Fill out the access request form with a clear business
            justification for why you need the data.</Typography></li>
          <li><Typography><strong>Notification:</strong> Your request triggers an automated email notification to the Data Steward
            or Data Owner responsible for that asset.</Typography></li>
          <li><Typography><strong>Track Status:</strong> You can later return to the application to search for the asset and view
            the updated approval status.</Typography></li>
        </ol>
      </>
    ),
  },
];

  const [expanded, setExpanded] = useState<string | false>(guideSections[0]?.id || false);
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', gap: 4, padding: '20px' }}>
      {/* Main Content Area (Accordions) */}
      <Box sx={{ flex: 3, minWidth: 0 }}>
        <Typography variant="h4" gutterBottom>
          Dataplex Business Interface User Guide
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {guideSections.map((section) => (
          <Accordion
            key={section.id}
            id={section.id}
            expanded={expanded === section.id}
            onChange={handleChange(section.id)}
            disableGutters
            sx={{
              boxShadow: 'none',
              '&:before': { display: 'none' },
              mb: 1,
              backgroundColor: '#f8fafd',
              borderRadius: '8px',
              overflow: 'hidden', 
              border: '1px solid #e0e0e0',
              '&:first-of-type': {
                borderTopLeftRadius: '8px',
                borderTopRightRadius: '8px',
              },
              '&:last-of-type': {
                borderBottomLeftRadius: '8px',
                borderBottomRightRadius: '8px',
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${section.id}-content`}
              id={`${section.id}-header`}
              sx={{
               
                '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.03)' }, 
               
                height: '64px',
                '&.Mui-expanded': {
                  minHeight: '64px', 
                },
               
              }}
            >
              <Typography variant="h6" component="div">
                {section.title}
              </Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                padding: 2,
                backgroundColor: '#ffffff',
              }}
            >
              {section.content}
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* Right-hand Navigation */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <Paper
          elevation={0}
          sx={{
            position: 'sticky',
            top: '100px',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
          }}
        >
          <Box sx={{ padding: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" component="div">
              On this page
            </Typography>
          </Box>
          <List dense>
            {guideSections.map((section) => (
            <ListItem
              key={`nav-${section.id}`}
              disablePadding
              component={Link}
              href={`#${section.id}`}
              onClick={(e) => handleNavClick(e, section.id)}
              sx={{
                textDecoration: 'none',
                color: '#0b57d0',
                width: '100%',
                padding: '8px 16px',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  textDecoration: 'none',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: 1.5, 
                  color: 'inherit',
                }}
              >
                <ArticleIcon sx={{ fontSize: '1.25rem' }} />
              </ListItemIcon>
              <ListItemText
                primary={section.title}
              />
            </ListItem>
          ))}
          </List>
        </Paper>
      </Box>
    </Box>
  );
};

export default UserGuide;