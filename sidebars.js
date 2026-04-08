// @ts-check

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.

 @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */
const sidebars = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [
    
    
        {
          type: 'category', 
          label: 'Overview',
          link: {
            type: 'generated-index',
            description: 'This section shows a simple example of what you can do with Tier0. Come take a look!',
        },
            items: [
              'Introduction',
              'Feature List',
              // 'What Can Tier0 Do',
              'Basic Guides/UNS Data Integration/User Journey',
              // 'Use Case/OEE Evaluation',
              
            ]
            },
            {
      type: 'category', 
      label: 'Quick Start Guide',
      link: {
        type: 'generated-index',
        description: 'This section guides you through the initial setup and configuration of Tier0.',
    },
        items: [
          'Getting Started/Deploy Tier0',
            'Getting Started/Login',
            'Getting Started/Homepage',
        ]
        },
            
            {
          type: 'category', 
          label: 'How-to Guide',
          link: {
            type: 'generated-index',
            description: 'This section provides guides on how to build data models and use them in Tier0.',
        },
            items: [
              'Basic Guides/UNS Data Integration/Build Data Models',
              'Basic Guides/UNS Data Integration/Connect Data Sources',
              {
          type: 'category', 
          label: 'Common Data Sources',
          link: {
            type: 'generated-index',
            description: 'This section provides guides on how to connect to various common data sources.',
        },
            items: [
              'Basic Guides/UNS Data Integration/Common Data Sources/Connecting OPC UA',
              'Basic Guides/UNS Data Integration/Common Data Sources/Connecting OPC DA',
              'Basic Guides/UNS Data Integration/Common Data Sources/Connecting Modbus',
              'Basic Guides/UNS Data Integration/Common Data Sources/Connecting MQTT',
              'Basic Guides/UNS Data Integration/Common Data Sources/Connecting File',
              'Basic Guides/UNS Data Integration/Common Data Sources/Connecting RestAPI',
            ]
            },
              
            'Basic Guides/UNS Data Integration/Process Data',
            {
          type: 'category', 
          label: 'Common Data Processing Methods',
          link: {
            type: 'generated-index',
            description: 'This section provides guides on general data processing methods.',
        },
            items: [
              'Basic Guides/UNS Data Integration/Common Data Processing Methods/Combining Multiple Sources',
              'Basic Guides/UNS Data Integration/Common Data Processing Methods/Filtering Data',
              'Basic Guides/UNS Data Integration/Common Data Processing Methods/Changing Data',
              'Basic Guides/UNS Data Integration/Common Data Processing Methods/Spliting Data',

            ]
            },
            
            'Basic Guides/UNS Data Integration/Visualize Data',
            'Basic Guides/UNS Data Integration/Display Data on Dashboards',
            'Basic Guides/UNS Data Integration/Obtain Data from Tier0',
            
            ]
          },
          {
          type: 'category', 
          label: 'Advanced Guide',
          link: {
            type: 'generated-index'
        },
            items: [
              // 'Basic Guides/Database Management/Data Source Management',
              // 'Basic Guides/Database Management/SQL Editor',
              
              'Basic Guides/Database Management/Container Management',
              'Basic Guides/Database Management/Notebook',
              // 'Basic Guides/Database Management/App Space',
              'Basic Guides/Database Management/Advanced Use',

            ]
            },
            {
          type: 'category', 
          label: 'System',
          link: {
            type: 'generated-index'
        },
            items: [
              'Basic Guides/System Management/Routing Management',
              'Basic Guides/System Management/User Management',
              'Basic Guides/System Management/Permission Management',
              // 'Basic Guides/System Management/I18n Management',
              'Basic Guides/System Management/Menu Config',
              // 'Basic Guides/System Management/Theme Management',
            ]
            },
            
              
            'Glossary'
  ],

  // But you can create a sidebar manually
  
  usecase: [
    // 'Use Case/OEE Evaluation',
    'Use Case/PCBA Process Simulation',

    // {
    //   type: 'category',
    //   label: 'Tutorial',
    //   items: ['tutorial-basics/create-a-document'],
    // },
  ],
   
};

export default sidebars;
