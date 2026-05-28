const sidebars = {
  tutorialSidebar: [
    
    
        {
          type: 'category', 
          label: 'Overview',
          link: {
            type: 'generated-index',
            description: 'This section introduces Tier0 concept and primary features. Come take a look!',
        },
            items: [
              'Introduction',
              'Feature List',
              'Basic Guides/UNS Data Integration/User Journey',
              
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
            type: 'generated-index',
            description: 'This section provides guides on advanced features on Tier0.',
        },
            items: [
              
              'Basic Guides/Database Management/Container Management',
              'Basic Guides/Database Management/Notebook',
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
              'Basic Guides/System Management/Open Data',
              'Basic Guides/System Management/Menu Config',
              'Basic Guides/System Management/Audit Log',
            ]
            },
            
              
            'Glossary'
  ],

  usecase: [
    'Use Case/PCBA Process Simulation',
  ],
   
};

export default sidebars;
