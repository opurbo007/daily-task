import ResetPasswordPage from "./resetPassword";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const { email, token } = await searchParams;
  
  return (
    <ResetPasswordPage
      email={email || ""}
      token={token || ""}
    />
  );
}