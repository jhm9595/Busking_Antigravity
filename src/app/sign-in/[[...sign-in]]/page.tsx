import { SignIn } from "@clerk/nextjs";

export default function Page() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-900 bg-[url('/bg-pattern.svg')] bg-cover">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className="z-10">
                <SignIn />
            </div>
        </div>
    );
}
