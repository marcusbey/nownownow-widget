import { h } from 'preact';
import { useState } from 'preact/hooks';

interface IntegrationTutorialProps {
  theme?: 'light' | 'dark';
  orgId?: string;
  token?: string;
}

const codeExamples = {
  head: `<!DOCTYPE html>
<html>
<head>
    <title>Your Website</title>
    
    <!-- Add the Now Widget script in the head -->
    <script 
      defer 
      src="https://nownownow.io/dist/now-widget.js" 
      data-user-id="DEMO_ORG_ID" 
      data-token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJERU1PX1VTRVIiLCJpYXQiOjE3MzAwMDAwMDAsImV4cCI6MTczMDAwMDAwMH0.DEMO_TOKEN_SIGNATURE" 
      data-theme="dark" 
      data-position="left" 
      data-button-color="#1a73e8" 
      data-button-size="90">
    </script>
</head>
<body>
    <!-- Your website content -->
</body>
</html>`,
  body: `<!DOCTYPE html>
<html>
<head>
    <title>Your Website</title>
</head>
<body>
    <!-- Your website content -->

    <!-- Add the Now Widget script before closing body tag -->
    <script 
      defer 
      src="https://nownownow.io/dist/now-widget.js" 
      data-user-id="DEMO_ORG_ID" 
      data-token="DEMO_TOKEN"
      data-theme="dark">
    </script>
</body>
</html>`
};

export function IntegrationTutorial({ theme = 'light', orgId = 'DEMO_ORG_ID', token = 'DEMO_TOKEN' }: IntegrationTutorialProps) {
  const [activeTab, setActiveTab] = useState<'head' | 'body'>('head');
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(
      activeTab === 'head' 
        ? codeExamples.head.replace('DEMO_ORG_ID', orgId).replace('DEMO_TOKEN_SIGNATURE', token)
        : codeExamples.body.replace('DEMO_ORG_ID', orgId).replace('DEMO_TOKEN', token)
    );
  };

  return (
    <div class={`integration-tutorial ${theme}`}>
      <h2 class="tutorial-title">Add Now Widget to Your Website</h2>
      
      <p class="tutorial-description">
        Integrate the Now Widget into your website by adding a single script tag. 
        You can place it either in the <code>&lt;head&gt;</code> or before the closing <code>&lt;/body&gt;</code> tag.
      </p>
      
      <div class="tabs">
        <button 
          class={`tab-button ${activeTab === 'head' ? 'active' : ''}`}
          onClick={() => setActiveTab('head')}
        >
          In &lt;head&gt;
        </button>
        <button 
          class={`tab-button ${activeTab === 'body' ? 'active' : ''}`}
          onClick={() => setActiveTab('body')}
        >
          Before &lt;/body&gt;
        </button>
      </div>
      
      <div class="code-container">
        <pre class="code-block">
          <code>{activeTab === 'head' ? codeExamples.head : codeExamples.body}</code>
        </pre>
        <button class="copy-button" onClick={handleCopyCode}>
          Copy Code
        </button>
      </div>
      
      <div class="configuration-options">
        <h3>Configuration Options</h3>
        <ul>
          <li><code>data-user-id</code>: Your unique user identifier (required)</li>
          <li><code>data-token</code>: Authentication token (required)</li>
          <li><code>data-theme</code>: Widget theme, either "light" or "dark" (default: "light")</li>
          <li><code>data-position</code>: Button position, either "left" or "right" (default: "left")</li>
          <li><code>data-button-color</code>: Custom color for the button (default: "#000000")</li>
          <li><code>data-button-size</code>: Size of the button in pixels (default: 60)</li>
        </ul>
      </div>
    </div>
  );
}
