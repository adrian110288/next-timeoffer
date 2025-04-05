export {};

declare global {
    interface CustomJwtSessionClaims {
        metadata: {
            role: string;
            onboardingCompleted: boolean;
            companyId: string;
            companyName: string;
        };
    }
}
