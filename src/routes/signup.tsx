import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { AuthHero, AuthLegal } from "@/components/auth";
import CustomInput from "@/components/custom-input";
import { AuthThemeToggle } from "@/components/theme";
// import { useAppStore } from "@/lib/core";
import { Icon, Logo } from "@/lib/ui";
import { PASSWORD_LABELS, UserRole } from "@/data";
import { SignupFormValues } from "@/utils/types";
import { useAppDispatch } from "@/services/hook";
import { useCustomMutation } from "@/hooks/api/use-api";
import {
  updateEmailType,
  updateUserEmail,
} from "@/services/features/auth/authSlice";

import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { useDeviceMetadata } from "@/hooks/auth/use-device-metadata";

export default function Signup() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const deviceMetadata = useDeviceMetadata();

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<SignupFormValues>({
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
    },
  });

  const password = watch("password") ?? "";

  const passwordRules: Array<[string, boolean]> = [
    ["8+ characters", password.length >= 8],
    ["Uppercase", /[A-Z]/.test(password)],
    ["Lowercase", /[a-z]/.test(password)],
    ["Number", /[0-9]/.test(password)],
    ["Special character", /[^A-Za-z0-9]/.test(password)],
  ];

  const passwordScore = passwordRules.filter(([, isValid]) => isValid).length;

  const passwordScoreColor =
    passwordScore >= 4
      ? "var(--mint-ink)"
      : passwordScore >= 2
        ? "var(--amber-ink)"
        : "var(--muted)";

  const signUpMutation = useCustomMutation({
    endpoint: "auth/register",
    successMessage: (data: any) => data?.data?.message,
    // errorMessage: (error: any) => error,
    onSuccessCallback: (data) => {
      // toast("Kindly check your email for a verification link");
      dispatch(updateUserEmail(data?.data?.email));
      dispatch(updateEmailType("Signup"));
      navigate("/email-sent");
    },
  });

  const submitForm: any = (data: any) => {
    delete data.conditions;
    const formValues = {
      ...data,
      role: UserRole.viewer,
    };

    signUpMutation.mutate(formValues);
  };

  return (
    <div className="authwrap">
      <AuthThemeToggle />

      <div onSubmit={handleSubmit(submitForm)} className="authform">
        <div className="authinner">
          <div className="authbrand">
            <Logo />
          </div>

          <div
            className="display"
            style={{
              fontSize: 30,
              marginBottom: 6,
            }}
          >
            Create your account
          </div>

          <div
            className="muted t14"
            style={{
              marginBottom: 22,
            }}
          >
            Start earning from day one — no approval queue, no gatekeeping.
          </div>

          <form
            className="card"
            style={{
              padding: 26,
            }}
            onSubmit={handleSubmit(submitForm)}
            noValidate
          >
            <SocialAuthButtons {...deviceMetadata} />

            <div className="authdiv">or with email</div>

            <div
              className="grid g2 gap12"
              style={{
                marginBottom: 14,
              }}
            >
              <CustomInput<SignupFormValues>
                name="firstName"
                id="signup-first-name"
                control={control}
                label="First name"
                placeholder="Ada"
                autoComplete="given-name"
                className="auth-input-compact"
                rules={{
                  required: "First name is required",
                  minLength: {
                    value: 2,
                    message: "First name must be at least 2 characters",
                  },
                }}
              />

              <CustomInput<SignupFormValues>
                name="lastName"
                id="signup-last-name"
                control={control}
                label="Last name"
                placeholder="Obi"
                autoComplete="family-name"
                className="auth-input-compact"
                rules={{
                  required: "Last name is required",
                  minLength: {
                    value: 2,
                    message: "Last name must be at least 2 characters",
                  },
                }}
              />
            </div>

            <div
              className="grid g2 gap12"
              style={{
                marginBottom: 14,
              }}
            >
              <CustomInput<SignupFormValues>
                name="email"
                id="signup-email"
                control={control}
                type="email"
                label="Email"
                placeholder="you@example.com"
                autoComplete="email"
                className="auth-input-compact"
                rules={{
                  required: "Email is required",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Enter a valid email address",
                  },
                }}
              />

              <CustomInput<SignupFormValues>
                name="username"
                id="signup-username"
                control={control}
                label="Username"
                placeholder="adaobi"
                autoComplete="username"
                className="auth-input-compact"
                rules={{
                  required: "Username is required",
                  minLength: {
                    value: 3,
                    message: "Username must be at least 3 characters",
                  },
                  pattern: {
                    value: /^[A-Za-z0-9_]+$/,
                    message: "Use only letters, numbers and underscores",
                  },
                }}
              />
            </div>

            <CustomInput<SignupFormValues>
              name="password"
              id="signup-password"
              control={control}
              type="password"
              label="Password"
              placeholder="Create a strong password"
              autoComplete="new-password"
              className="auth-input-last"
              rules={{
                required: "Password is required",
                validate: {
                  minimumLength: (value) =>
                    value.length >= 8 ||
                    "Password must contain at least 8 characters",

                  uppercase: (value) =>
                    /[A-Z]/.test(value) ||
                    "Password must contain an uppercase letter",

                  lowercase: (value) =>
                    /[a-z]/.test(value) ||
                    "Password must contain a lowercase letter",

                  number: (value) =>
                    /[0-9]/.test(value) || "Password must contain a number",

                  specialCharacter: (value) =>
                    /[^A-Za-z0-9]/.test(value) ||
                    "Password must contain a special character",
                },
              }}
            />

            <div
              className="card"
              style={{
                padding: 14,
                margin: "14px 0",
              }}
            >
              <div
                className="row between"
                style={{
                  marginBottom: 10,
                }}
              >
                <span className="up muted">Password strength</span>

                <span
                  className="t12 b7"
                  style={{
                    color: passwordScoreColor,
                  }}
                >
                  {PASSWORD_LABELS[passwordScore]}
                </span>
              </div>

              <div
                className="progress"
                style={{
                  marginBottom: 12,
                }}
              >
                <i
                  style={{
                    width: `${passwordScore * 20}%`,
                  }}
                />
              </div>

              <div className="grid g2 gap8">
                {passwordRules.map(([label, isValid]) => (
                  <div
                    key={label}
                    className="row gap8 t13"
                    style={{
                      color: isValid ? "var(--mint-ink)" : "var(--muted2)",
                    }}
                  >
                    <Icon n="check" s={14} />

                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-blue btn-block"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create Account"}
            </button>

            <div
              className="row center muted t14"
              style={{
                marginTop: 16,
                gap: 5,
              }}
            >
              <span>Already have an account?</span>

              <button
                type="button"
                className="blue b6"
                style={{
                  cursor: "pointer",
                }}
                onClick={() => navigate("/login")}
              >
                Log in
              </button>
            </div>
          </form>

          <AuthLegal verb="creating an account" />
        </div>
      </div>

      <AuthHero
        title="Turn an audience into income."
        sub="Set your own tiers, price your own drops, go live whenever you want. Payouts clear the same day and the fan relationship stays yours — not the platform's."
      />
    </div>
  );
}
