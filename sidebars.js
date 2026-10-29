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
          'Getting Started/High Availability Deployment',
          'Getting Started/Standard Private Deployment',
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
              {
                type: 'category',
                label: 'Connect Data',
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
                    ],
                  },
                  'Basic Guides/UNS Data Integration/Connect Data via MQTT',
                ],
              },
              {
                type: 'category',
                label: 'Process Data',
                items: [
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
                    ],
                  },
                  'Basic Guides/UNS Data Integration/Visualize Data',
                ],
              },
              'Basic Guides/UNS Data Integration/Talk to UNS Models',
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
              {
                type: 'category',
                label: 'Sync Data',
                items: [
                  'Basic Guides/Data Analysis/Data Synchronization',
                  'Basic Guides/UNS Data Integration/Obtain Data from Tier0',
                ],
              },
              {
                type: 'category',
                label: 'Use Data',
                items: [
                  'Basic Guides/App/Industrial Apps',
                  'Basic Guides/App/Anchor',
                  'Basic Guides/App/Scene',
                ],
              },
              {
                type: 'category',
                label: 'Analyze Data',
                items: [
                  'Basic Guides/Data Analysis/Notebook',
                  'Basic Guides/Data Analysis/Vision',
                ],
              },
            ]
            },
            'Basic Guides/System Management/System Settings',
            
              
            'Glossary'
  ],

};

export default sidebars;
