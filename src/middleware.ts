import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/api/webhooks/(.*)"]);
const isOnboardingRoute = createRouteMatcher(["/onboarding"]);
const isAdminRoute = createRouteMatcher(["/admin", "/admin/(.*)"]);
const isEmployeeRoute = createRouteMatcher(["/employee", "/employee/(.*)"]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
    const { userId, sessionClaims, redirectToSignIn } = await auth();

    console.log(sessionClaims?.metadata);

    console.log(req.nextUrl.searchParams.get("onboardingCompleted"));

    if (
        userId &&
        req.nextUrl.pathname === "/" &&
        !sessionClaims?.metadata?.onboardingCompleted
    ) {
        const onboardingUrl = new URL("/onboarding", req.url);
        return NextResponse.redirect(onboardingUrl);
    }

    if (
        userId &&
        req.nextUrl.pathname === "/" &&
        sessionClaims?.metadata?.onboardingCompleted &&
        sessionClaims?.metadata?.role === "ADMIN"
    ) {
        const adminUrl = new URL("/admin", req.url);
        return NextResponse.redirect(adminUrl);
    }

    if (
        userId &&
        req.nextUrl.pathname === "/" &&
        sessionClaims?.metadata?.onboardingCompleted &&
        sessionClaims?.metadata?.role === "EMPLOYEE"
    ) {
        const employeeUrl = new URL("/employee", req.url);
        return NextResponse.redirect(employeeUrl);
    }

    if (isPublicRoute(req)) return NextResponse.next();

    if (!userId && !isPublicRoute(req)) {
        return redirectToSignIn({
            returnBackUrl: req.url,
        });
    }

    if (
        userId &&
        sessionClaims?.metadata?.onboardingCompleted &&
        isOnboardingRoute(req)
    ) {
        console.log("Onboarding completed, redirecting to appropriate page");
        if (sessionClaims?.metadata?.role === "ADMIN") {
            console.log("Redirecting admin to admin page");
            const adminUrl = new URL("/admin", req.url);
            return NextResponse.redirect(adminUrl);
        } else {
            console.log("Redirecting employee to employee page");
            const employeeUrl = new URL("/employee", req.url);
            return NextResponse.redirect(employeeUrl);
        }
    }

    if (userId && isOnboardingRoute(req)) {
        if (req.nextUrl.searchParams.get("onboardingCompleted")) {
            console.log(
                "Onboarding completed, redirecting to appropriate page"
            );
            if (sessionClaims?.metadata?.role === "ADMIN") {
                const adminUrl = new URL("/admin", req.url);
                return NextResponse.redirect(adminUrl);
            } else {
                const employeeUrl = new URL("/employee", req.url);
                return NextResponse.redirect(employeeUrl);
            }
        }
        return NextResponse.next();
    }

    if (
        userId &&
        !sessionClaims?.metadata?.onboardingCompleted &&
        !isOnboardingRoute(req)
    ) {
        const onboardingUrl = new URL("/onboarding", req.url);
        return NextResponse.redirect(onboardingUrl);
    }

    if (isAdminRoute(req)) {
        if (sessionClaims?.metadata?.role === "ADMIN") {
            return NextResponse.next();
        } else {
            const homepageUrl = new URL("/", req.url);
            return NextResponse.redirect(homepageUrl);
        }
    }

    if (isEmployeeRoute(req)) {
        if (sessionClaims?.metadata?.role === "EMPLOYEE") {
            return NextResponse.next();
        } else {
            const homepageUrl = new URL("/", req.url);
            return NextResponse.redirect(homepageUrl);
        }
    }

    if (userId) {
        return NextResponse.next();
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
