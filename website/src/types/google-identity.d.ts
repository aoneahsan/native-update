declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenClient {
        requestAccessToken(): void;
      }

      interface TokenClientConfig {
        client_id: string;
        scope: string;
        prompt?: string;
        callback: (response: TokenResponse) => void;
      }

      interface TokenResponse {
        access_token: string;
        expires_in: number;
        scope: string;
        token_type: string;
        error?: string;
        error_description?: string;
      }

      function initTokenClient(config: TokenClientConfig): TokenClient;
    }
  }
}
