import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import {  NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
    if(isPublicRoutes(req)) return NextResponse.next();
});

const isPublicRoutes = createRouteMatcher(["/", "/api/webhook/(.*) "]);

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Always run for API routes
        "/(api|trpc)(.*)",
    ],
};
