export type ChatUser = {
  id: string;
  name: string;
  role: 'BUYER' | 'SELLER';
  avatar?: string;
};

export type ChatYarn = {
  id: string;
  name: string;
  image?: string;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  createdAt: string;
  read: boolean;
};

export type ChatConversation = {
  id: string;
  buyer: ChatUser;
  seller: ChatUser;
  yarn: ChatYarn;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

const seller: ChatUser = {
  id: 'seller-demo',
  name: 'Meera Weaves',
  role: 'SELLER',
};

const daysAgo = (days: number, hours = 0) =>
  new Date(Date.now() - (days * 24 + hours) * 60 * 60 * 1000).toISOString();

export const mockConversations: ChatConversation[] = [
  {
    id: 'mock-cotton-2kg',
    buyer: { id: 'buyer-ananya', name: 'Ananya Sharma', role: 'BUYER' },
    seller,
    yarn: { id: 'yarn-cotton-2kg', name: 'Handloom Cotton — 2kg', image: '/blue.jpg' },
    lastMessage: 'Could you share the thread count?',
    lastMessageAt: daysAgo(0, 2),
    unreadCount: 2,
  },
  {
    id: 'mock-silk-bundle',
    buyer: { id: 'buyer-kavya', name: 'Kavya Iyer', role: 'BUYER' },
    seller,
    yarn: { id: 'yarn-silk-bundle', name: 'Mulberry Silk Bundle — 1.5kg', image: '/blue.jpg' },
    lastMessage: 'Thank you, I will place the order today.',
    lastMessageAt: daysAgo(1, 4),
    unreadCount: 0,
  },
  {
    id: 'mock-wool-cone',
    buyer: { id: 'buyer-rohan', name: 'Rohan Verma', role: 'BUYER' },
    seller,
    yarn: { id: 'yarn-wool-cone', name: 'Natural Wool Cone — 3kg', image: '/blue.jpg' },
    lastMessage: 'Is this shade closer to charcoal or grey?',
    lastMessageAt: daysAgo(2, 6),
    unreadCount: 1,
  },
  {
    id: 'mock-linen-set',
    buyer: { id: 'buyer-priya', name: 'Priya Nair', role: 'BUYER' },
    seller,
    yarn: { id: 'yarn-linen-set', name: 'Linen Weaving Set — 2.5kg', image: '/blue.jpg' },
    lastMessage: 'The parcel arrived safely. Thanks!',
    lastMessageAt: daysAgo(4, 1),
    unreadCount: 0,
  },
];

export const mockMessages: Record<string, ChatMessage[]> = {
  'mock-cotton-2kg': [
    { id: 'cotton-1', conversationId: 'mock-cotton-2kg', senderId: 'buyer-ananya', text: 'Hello, is this cotton suitable for handloom weaving?', createdAt: daysAgo(1, 5), read: true },
    { id: 'cotton-2', conversationId: 'mock-cotton-2kg', senderId: 'seller-demo', text: 'Yes, it is a soft, tightly spun cotton yarn for handloom work.', createdAt: daysAgo(1, 4), read: true },
    { id: 'cotton-3', conversationId: 'mock-cotton-2kg', senderId: 'buyer-ananya', text: 'Does the 2kg bundle include one continuous lot?', createdAt: daysAgo(1, 3), read: true },
    { id: 'cotton-4', conversationId: 'mock-cotton-2kg', senderId: 'seller-demo', text: 'Yes, both cones are from the same dye lot.', createdAt: daysAgo(1, 2), read: true },
    { id: 'cotton-5', conversationId: 'mock-cotton-2kg', senderId: 'buyer-ananya', text: 'Could you share the thread count?', createdAt: daysAgo(0, 2), read: false },
  ],
  'mock-silk-bundle': [
    { id: 'silk-1', conversationId: 'mock-silk-bundle', senderId: 'buyer-kavya', text: 'Hi, is the silk naturally dyed?', createdAt: daysAgo(2, 7), read: true },
    { id: 'silk-2', conversationId: 'mock-silk-bundle', senderId: 'seller-demo', text: 'It is dyed with a low-impact plant-based process.', createdAt: daysAgo(2, 6), read: true },
    { id: 'silk-3', conversationId: 'mock-silk-bundle', senderId: 'buyer-kavya', text: 'Would it work for a light stole?', createdAt: daysAgo(2, 5), read: true },
    { id: 'silk-4', conversationId: 'mock-silk-bundle', senderId: 'seller-demo', text: 'Definitely. The yarn has a fine, even texture.', createdAt: daysAgo(2, 4), read: true },
    { id: 'silk-5', conversationId: 'mock-silk-bundle', senderId: 'buyer-kavya', text: 'Thank you, I will place the order today.', createdAt: daysAgo(1, 4), read: true },
  ],
  'mock-wool-cone': [
    { id: 'wool-1', conversationId: 'mock-wool-cone', senderId: 'buyer-rohan', text: 'Is this wool cone still available?', createdAt: daysAgo(3, 8), read: true },
    { id: 'wool-2', conversationId: 'mock-wool-cone', senderId: 'seller-demo', text: 'Yes, it is available and ready to ship.', createdAt: daysAgo(3, 7), read: true },
    { id: 'wool-3', conversationId: 'mock-wool-cone', senderId: 'buyer-rohan', text: 'Is the yarn soft enough for a winter scarf?', createdAt: daysAgo(3, 6), read: true },
    { id: 'wool-4', conversationId: 'mock-wool-cone', senderId: 'seller-demo', text: 'Yes, it is a soft natural wool with a gentle texture.', createdAt: daysAgo(3, 5), read: true },
    { id: 'wool-5', conversationId: 'mock-wool-cone', senderId: 'buyer-rohan', text: 'Is this shade closer to charcoal or grey?', createdAt: daysAgo(2, 6), read: false },
  ],
  'mock-linen-set': [
    { id: 'linen-1', conversationId: 'mock-linen-set', senderId: 'buyer-priya', text: 'Could you confirm the total weight of the set?', createdAt: daysAgo(5, 5), read: true },
    { id: 'linen-2', conversationId: 'mock-linen-set', senderId: 'seller-demo', text: 'The set contains 2.5kg in total across three cones.', createdAt: daysAgo(5, 4), read: true },
    { id: 'linen-3', conversationId: 'mock-linen-set', senderId: 'buyer-priya', text: 'That works perfectly for my project.', createdAt: daysAgo(5, 3), read: true },
    { id: 'linen-4', conversationId: 'mock-linen-set', senderId: 'seller-demo', text: 'Glad to hear it. I will pack it securely.', createdAt: daysAgo(5, 2), read: true },
    { id: 'linen-5', conversationId: 'mock-linen-set', senderId: 'buyer-priya', text: 'The parcel arrived safely. Thanks!', createdAt: daysAgo(4, 1), read: true },
  ],
};

export function getConversationsForUser(userId: string, role: 'BUYER' | 'SELLER'): ChatConversation[] {
  if (role === 'SELLER') {
    return mockConversations.filter((conversation) => conversation.seller.id === userId || conversation.seller.id === 'seller-demo');
  }

  return mockConversations.filter((conversation) => conversation.buyer.id === userId);
}

export function getMessagesForConversation(conversationId: string): ChatMessage[] {
  return [...(mockMessages[conversationId] || [])];
}
