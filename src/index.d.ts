declare interface RegistrationResult {
  id: string;
  email: string;
  login: string;
}

declare interface TenantRegistrationResult extends RegistrationResult {

}

declare interface ClientChatMessage {
  text: string;
  senderId: string;
  conversationId: string;
  _id?: string;
}

declare interface Query {
  skip: string; // because it comes from Http request
  limit: string;
  sort: any;
}

declare interface ExploreResponse {
  featured: any;
  online: any;
  'new': any;
}

declare interface AllRolesExploreResponse {
  users: ExploreResponse;
  advisors: ExploreResponse;
}

declare interface UserRegistrationResult extends RegistrationResult {
  tenant: string;
  sub: string;
  scope?: any;
}

declare interface VerificationResult {
  id: string;
  login: string;
  jti: string;
  iat: number;
  aud: string;
}

declare interface TenantVerificationResult extends VerificationResult {
  isTenant: boolean;
}

declare interface UserVerificationResult extends VerificationResult {
  deviceId: string;
  sub: string;
  exp: number;
  scope?: any;
}

declare interface UserVerificationResponse {
  decoded: UserVerificationResult;
}

declare interface TenantVerificationResponse {
  decoded: TenantVerificationResult;
}

declare interface AuthUserData {
  email: string;
  login: string;
  password: string;
  sub: string;
  scope?: any;
}

declare interface UserLoginData {
  login: string;
  password: string;
  deviceId: string;
}

declare interface AccessTokenResponse {
  accessToken: string;
}

declare interface AuthClientInterface {
  tenantToken: string;
  registerTenant(email: string, password: string): Promise<TenantRegistrationResult>;
  loginTenant(email: string, password: string): Promise<AccessTokenResponse>;
  verifyTenantToken(token: string): Promise<TenantVerificationResult>;
  logoutTenant(token: string): Promise<void>;
  createUser(data: AuthUserData): Promise<UserRegistrationResult>;
  loginUser(data: UserLoginData): Promise<AccessTokenResponse>;
  verifyUserToken(token: string): Promise<UserVerificationResult>;
  logoutUser(token: string): Promise<void>;
  deleteUser(login: string): Promise<void>;
}

declare interface FacebookServiceInterface {
  getUserByToken(accessToken: string): Promise<any>;
}

declare interface UserServiceInterface {
  loginOrRegisterWithFacebook(accessToken: string, oneSignalId: string): Promise<LoginWithFacebookResponse>;
  findUserById(userId: string): Promise<any>;
  rate(source: any, target: any, rating: number): Promise<boolean>;
  updateUser(user: any, data: any): Promise<any>;
  makeAdvisor(userId: string): Promise<any>;
  addFakes(amount?: number): Promise<void>;
  explore(user: any): Promise<ExploreResponse>;
  exploreAll(): Promise<AllRolesExploreResponse>;
  findNew(user: any, pagination: any): Promise<any>;
  findOnline(user: any, pagination: any): Promise<any>;
  findFeatured(user: any, pagination: any): Promise<any>;
}

declare interface ChatServiceInterface {
  sendMessage(from: any, message: ClientChatMessage): Promise<any>;
  listConversations(user: any): Promise<ConversationPreview[]>;
  fetchMessages(conversationId: string, key?: number): Promise<any[]>;
  findOrCreateConversation(userId: string, companion: string): Promise<ConversationPreview>;
}

declare interface Result {
  status: number;
}

declare interface InitiateResult extends Result {
  verificationId: string;
  attempts: number;
  expiredOn: number;
  method: string;
  code?: string;
  totpUri?: string;
  qrPngDataUri?: string;
}

declare interface ValidationResult extends Result {
  data?: {
    verificationId: string;
    consumer: string;
    expiredOn: number;
    attempts: number;
    payload?: any;
  };
}

declare interface ConversationPreview {
  _id: string;
  messages: any[];
  friend: any;
  user: any;
}

declare interface FacebookUserData {
  email: string;
  first_name: string;
  last_name: string;
  picture: any;
  oneSignal: string;
  gender?: string;
  birthday?: string;
  id: string; // note it's  FacebookID
}

// @TODO type for user key
declare interface LoginWithFacebookResponse {
  token: string;
  user: any;
}
