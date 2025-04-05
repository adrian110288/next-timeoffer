import OnboardingForm from "@/components/OnboardingForm";
import { currentUser } from "@clerk/nextjs/server";

const page = async () => {
    const user = await currentUser();

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container max-w-md mx-auto py-10">
            <h1 className="text-2xl font-bold mb-6">Complete your profile</h1>
            <OnboardingForm
                userEmail={user.emailAddresses[0].emailAddress}
                firstName={user.firstName || ""}
                lastName={user.lastName || ""}
            />
        </div>
    );
};

export default page;
