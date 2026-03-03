import { auth } from "./auth";


export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { nextUrl } = req;


    const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
    const isPublicRoute = ["/", "/login", "/register"].includes(nextUrl.pathname) || nextUrl.pathname.startsWith("/s/");
    const isAuthRoute = ["/login", "/register"].includes(nextUrl.pathname);


    if (isApiAuthRoute) return;


    if (isAuthRoute) {
        if (isLoggedIn) {
            return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return;
    }


    if (!isLoggedIn && !isPublicRoute) {
        return Response.redirect(new URL("/login", nextUrl));
    }


    return;
});


export const config = {
    matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
