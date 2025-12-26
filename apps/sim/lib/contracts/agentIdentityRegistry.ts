// Agent Identity Registry Contract Configuration
export const AGENT_IDENTITY_REGISTRY_ADDRESS = '0xcaBCA569241042C8e16E106B887E29AA46f4e4aA' as const

// Full Contract ABI for AgentIdentityRegistry
export const AGENT_IDENTITY_REGISTRY_ABI = [
  {
    inputs: [],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'target',
        type: 'address',
      },
    ],
    name: 'AddressEmptyCode',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'implementation',
        type: 'address',
      },
    ],
    name: 'ERC1967InvalidImplementation',
    type: 'error',
  },
  {
    inputs: [],
    name: 'ERC1967NonPayable',
    type: 'error',
  },
  {
    inputs: [],
    name: 'FailedCall',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidInitialization',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotInitializing',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'OwnableInvalidOwner',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'OwnableUnauthorizedAccount',
    type: 'error',
  },
  {
    inputs: [],
    name: 'UUPSUnauthorizedCallContext',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'slot',
        type: 'bytes32',
      },
    ],
    name: 'UUPSUnsupportedProxiableUUID',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'agentId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'string',
        name: 'userDID',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'username',
        type: 'string',
      },
    ],
    name: 'AgentLinkedToUser',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'agentId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'newMetadata',
        type: 'string',
      },
    ],
    name: 'AgentMetadataUpdated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'agentId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'agentWallet',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'ownerWallet',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'userDID',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'agentDID',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'metadata',
        type: 'string',
      },
    ],
    name: 'AgentRegistered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'agentId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'isActive',
        type: 'bool',
      },
    ],
    name: 'AgentStatusChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'agentId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'tokenName',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'tokenSymbol',
        type: 'string',
      },
      {
        indexed: false,
        internalType: 'string',
        name: 'ipfsHash',
        type: 'string',
      },
    ],
    name: 'AgentTokenCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'agentId',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'agentWallet',
        type: 'address',
      },
    ],
    name: 'AgentWalletCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint64',
        name: 'version',
        type: 'uint64',
      },
    ],
    name: 'Initialized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'implementation',
        type: 'address',
      },
    ],
    name: 'Upgraded',
    type: 'event',
  },
  {
    inputs: [],
    name: 'UPGRADE_INTERFACE_VERSION',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'agentId',
        type: 'uint256',
      },
    ],
    name: 'deactivateAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'didRegistry',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'agentId',
        type: 'uint256',
      },
    ],
    name: 'getAgent',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'agentId',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'agentWallet',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'ownerWallet',
            type: 'address',
          },
          {
            internalType: 'string',
            name: 'userDID',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'agentDID',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'metadata',
            type: 'string',
          },
          {
            internalType: 'bool',
            name: 'isActive',
            type: 'bool',
          },
          {
            internalType: 'uint256',
            name: 'registeredAt',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'tokenAddress',
            type: 'address',
          },
          {
            internalType: 'string',
            name: 'tokenName',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'tokenSymbol',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'tokenIpfsHash',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'deploymentState',
            type: 'string',
          },
        ],
        internalType: 'struct AgentIdentityRegistry.AgentInfo',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'agentDID',
        type: 'string',
      },
    ],
    name: 'getAgentByDID',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'agentId',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'agentWallet',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'ownerWallet',
            type: 'address',
          },
          {
            internalType: 'string',
            name: 'userDID',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'agentDID',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'metadata',
            type: 'string',
          },
          {
            internalType: 'bool',
            name: 'isActive',
            type: 'bool',
          },
          {
            internalType: 'uint256',
            name: 'registeredAt',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'tokenAddress',
            type: 'address',
          },
          {
            internalType: 'string',
            name: 'tokenName',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'tokenSymbol',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'tokenIpfsHash',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'deploymentState',
            type: 'string',
          },
        ],
        internalType: 'struct AgentIdentityRegistry.AgentInfo',
        name: '',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'agentId',
        type: 'uint256',
      },
    ],
    name: 'getDeploymentState',
    outputs: [
      {
        internalType: 'string',
        name: 'deploymentState',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
    ],
    name: 'getAgentIdByToken',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'agentWallet',
        type: 'address',
      },
    ],
    name: 'getAgentIdByWallet',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'agentId',
        type: 'uint256',
      },
    ],
    name: 'getAgentWithUserContext',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'agentId',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'agentWallet',
            type: 'address',
          },
          {
            internalType: 'address',
            name: 'ownerWallet',
            type: 'address',
          },
          {
            internalType: 'string',
            name: 'userDID',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'agentDID',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'metadata',
            type: 'string',
          },
          {
            internalType: 'bool',
            name: 'isActive',
            type: 'bool',
          },
          {
            internalType: 'uint256',
            name: 'registeredAt',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'tokenAddress',
            type: 'address',
          },
          {
            internalType: 'string',
            name: 'tokenName',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'tokenSymbol',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'tokenIpfsHash',
            type: 'string',
          },
          {
            internalType: 'string',
            name: 'deploymentState',
            type: 'string',
          },
        ],
        internalType: 'struct AgentIdentityRegistry.AgentInfo',
        name: 'agent',
        type: 'tuple',
      },
      {
        internalType: 'string',
        name: 'username',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'getAgentsByOwner',
    outputs: [
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'userDID',
        type: 'string',
      },
    ],
    name: 'getAgentsByUserDID',
    outputs: [
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getTotalAgents',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'initialOwner',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_didRegistry',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '_usernameRegistry',
        type: 'address',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'proxiableUUID',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'agentId',
        type: 'uint256',
      },
    ],
    name: 'reactivateAgent',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'metadata',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'tokenName',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'tokenSymbol',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'tokenIpfsHash',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'deploymentState',
        type: 'string',
      },
    ],
    name: 'registerAgent',
    outputs: [
      {
        internalType: 'uint256',
        name: 'agentId',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'agentDID',
        type: 'string',
      },
      {
        internalType: 'address',
        name: 'agentWallet',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'metadata',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'tokenName',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'tokenSymbol',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'tokenIpfsHash',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'deploymentState',
        type: 'string',
      },
    ],
    name: 'registerAgentWithoutDID',
    outputs: [
      {
        internalType: 'uint256',
        name: 'agentId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'agentWallet',
        type: 'address',
      },
      {
        internalType: 'address',
        name: 'tokenAddress',
        type: 'address',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes4',
        name: 'interfaceId',
        type: 'bytes4',
      },
    ],
    name: 'supportsInterface',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'agentId',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'newMetadata',
        type: 'string',
      },
    ],
    name: 'updateAgentMetadata',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'agentId',
        type: 'uint256',
      },
      {
        internalType: 'string',
        name: 'newDeploymentState',
        type: 'string',
      },
    ],
    name: 'updateDeploymentState',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newImplementation',
        type: 'address',
      },
      {
        internalType: 'bytes',
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'usernameRegistry',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const
