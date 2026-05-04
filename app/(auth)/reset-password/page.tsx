import ResetPasswordPage from "./resetPassword";

export default function Page({
  searchParams,
}: {
  searchParams: { email?: string; token?: string };
}) {
  return (
    <ResetPasswordPage
      email={searchParams.email || ""}
      token={searchParams.token || ""}
    />
  );
}