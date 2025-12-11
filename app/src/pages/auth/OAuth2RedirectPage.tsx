import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setAuthTokens } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export const OAuth2RedirectPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser, user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Completing login...");
  const [hasProcessed, setHasProcessed] = useState(false);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Handle OAuth2 callback
  useEffect(() => {
    const handleOAuth2Redirect = async () => {
      // Prevent multiple calls
      if (hasProcessed) {
        return;
      }
      setHasProcessed(true);
      const token = searchParams.get("token");
      const refreshToken =
        searchParams.get("refresh") || searchParams.get("refreshToken");
      const error = searchParams.get("error");

      console.log("OAuth2 Redirect params:", {
        token: token?.slice(0, 20) + "...",
        refreshToken,
        error,
      });

      if (error) {
        setStatus("error");
        setMessage(error);
        toast.error(error);
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      if (!token || !refreshToken) {
        setStatus("error");
        setMessage("Invalid OAuth2 response - missing tokens");
        toast.error("Invalid OAuth2 response");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      try {
        // Set tokens first and wait a bit to ensure they're set
        console.log("Setting auth tokens...");
        setAuthTokens(token, refreshToken);

        // Small delay to ensure token is set in localStorage and interceptor
        await new Promise((resolve) => setTimeout(resolve, 100));

        setMessage("Fetching user info...");

        // Fetch user info
        console.log("Refreshing user...");
        await refreshUser();

        setStatus("success");
        setMessage("Login successful! Redirecting...");
        toast.success("Login with Google successful!");

        // Mark that we should redirect once user is available
        setShouldRedirect(true);
      } catch (err: any) {
        console.error("OAuth2 redirect error:", err);
        setStatus("error");
        setMessage(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to complete login"
        );
        toast.error("Failed to complete login");
        setTimeout(() => navigate("/login"), 2000);
      }
    };

    handleOAuth2Redirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]); // Only run when searchParams change (OAuth2 callback)

  // Navigate once user is available
  useEffect(() => {
    if (shouldRedirect && user) {
      console.log("User role from context:", user.role);
      if (user.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } else if (shouldRedirect && !user) {
      // Fallback: decode token if user not in context yet (after a short delay)
      setTimeout(() => {
        const storedToken = localStorage.getItem("accessToken");
        if (storedToken) {
          try {
            const payload = JSON.parse(atob(storedToken.split(".")[1]));
            const role = payload.role;
            console.log("User role from token:", role);

            if (role === "ADMIN") {
              navigate("/admin", { replace: true });
            } else {
              navigate("/dashboard", { replace: true });
            }
          } catch (e) {
            console.error("Error decoding token:", e);
            // Default to dashboard instead of home
            navigate("/dashboard", { replace: true });
          }
        } else {
          // Default to dashboard instead of home
          navigate("/dashboard", { replace: true });
        }
      }, 500);
    }
  }, [shouldRedirect, user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center p-8 rounded-2xl bg-slate-900/50 border border-slate-800">
        {status === "loading" && (
          <>
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-4" />
            <p className="text-slate-300 text-lg">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <p className="text-emerald-400 text-lg font-medium">{message}</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-red-400 text-lg font-medium">{message}</p>
            <p className="text-slate-500 mt-2">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuth2RedirectPage;
