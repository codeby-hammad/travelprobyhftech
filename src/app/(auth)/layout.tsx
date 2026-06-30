// This layout wraps both the login and register pages
// The (auth) folder name with parentheses is a "route group"
// It groups pages together without affecting the URL

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}