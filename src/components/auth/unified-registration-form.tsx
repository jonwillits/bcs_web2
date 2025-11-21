"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { NeuralButton } from "@/components/ui/neural-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Eye, EyeOff, CheckCircle, GraduationCap, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StudentRegistrationFields } from "./student-registration-fields";
import { FacultyRegistrationFields } from "./faculty-registration-fields";
import { USER_ROLES } from "@/lib/auth/utils";

type UserRole = "student" | "faculty";

export function UnifiedRegistrationForm() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("student");

  // Common fields
  const [commonData, setCommonData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Student-specific fields
  const [studentData, setStudentData] = useState({
    major: "",
    graduation_year: "",
    academic_interests: [] as string[],
  });

  // Faculty-specific fields
  const [facultyData, setFacultyData] = useState({
    university: "",
    department: "",
    title: "",
    research_area: "",
    personal_website_url: "",
    request_statement: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const router = useRouter();

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const maxLength = password.length <= 128;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[@$!%*?&]/.test(password);

    return (
      minLength &&
      maxLength &&
      hasUppercase &&
      hasLowercase &&
      hasNumber &&
      hasSpecialChar
    );
  };

  const handleCommonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCommonData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const handleStudentChange = (field: string, value: any) => {
    setStudentData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError("");
  };

  const handleFacultyChange = (field: string, value: string) => {
    setFacultyData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Common validation
    if (!commonData.name.trim()) {
      setError("Name is required");
      setIsLoading(false);
      return;
    }

    if (!commonData.email.trim()) {
      setError("Email is required");
      setIsLoading(false);
      return;
    }

    if (!validatePassword(commonData.password)) {
      setError(
        "Password must be 8-128 characters and include uppercase, lowercase, number, and special character (@$!%*?&)"
      );
      setIsLoading(false);
      return;
    }

    if (commonData.password !== commonData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Role-specific validation
    if (selectedRole === "student") {
      if (!studentData.major) {
        setError("Please select your major");
        setIsLoading(false);
        return;
      }

      if (!studentData.graduation_year) {
        setError("Please select your graduation year");
        setIsLoading(false);
        return;
      }
    } else if (selectedRole === "faculty") {
      if (!facultyData.university.trim()) {
        setError("University is required for faculty registration");
        setIsLoading(false);
        return;
      }

      if (!facultyData.department.trim()) {
        setError("Department is required for faculty registration");
        setIsLoading(false);
        return;
      }

      if (!facultyData.title) {
        setError("Please select your title/position");
        setIsLoading(false);
        return;
      }

      if (!facultyData.research_area.trim()) {
        setError("Research area is required for faculty registration");
        setIsLoading(false);
        return;
      }

      if (!facultyData.request_statement.trim()) {
        setError("Please provide a statement explaining why you need faculty access");
        setIsLoading(false);
        return;
      }

      if (facultyData.request_statement.trim().length < 50) {
        setError("Statement must be at least 50 characters");
        setIsLoading(false);
        return;
      }
    }

    try {
      // Build request body based on role
      const requestBody: any = {
        name: commonData.name.trim(),
        email: commonData.email.trim().toLowerCase(),
        password: commonData.password,
        role: selectedRole,
      };

      if (selectedRole === "student") {
        requestBody.major = studentData.major;
        requestBody.graduation_year = parseInt(studentData.graduation_year, 10);
        requestBody.academic_interests = studentData.academic_interests;
      } else if (selectedRole === "faculty") {
        requestBody.university = facultyData.university.trim();
        requestBody.department = facultyData.department.trim();
        requestBody.title = facultyData.title;
        requestBody.research_area = facultyData.research_area.trim();
        requestBody.personal_website_url = facultyData.personal_website_url.trim() || null;
        requestBody.request_statement = facultyData.request_statement.trim();
      }

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle Zod validation errors with detailed field-specific messages
        if (data.details && Array.isArray(data.details) && data.details.length > 0) {
          const errorMessages = data.details
            .map((detail: { field: string; message: string }) => `${detail.field}: ${detail.message}`)
            .join("; ");
          throw new Error(errorMessages);
        }
        throw new Error(data.error || "Registration failed");
      }

      setSuccess(true);

      // Different success messages based on role
      if (selectedRole === "student") {
        setSuccessMessage("Registration successful! Please check your email to verify your account before signing in.");
      } else {
        setSuccessMessage("Faculty request submitted! Your request will be reviewed by an administrator. You will receive an email notification once it has been approved.");
      }

      setTimeout(() => {
        if (selectedRole === "student") {
          router.push("/auth/login?message=Registration successful! Please check your email to verify your account.");
        } else {
          router.push("/auth/pending-approval");
        }
      }, 3000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card className="cognitive-card">
            <CardHeader>
              <CardTitle className="text-center text-green-600">
                <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                {selectedRole === "student" ? "Registration Successful!" : "Request Submitted!"}
              </CardTitle>
              <CardDescription className="text-center">
                {successMessage}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-neural-primary">
            Create Your Account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Join the BCS E-Textbook Platform
          </p>
        </div>

        <Card className="cognitive-card">
          <CardHeader>
            <CardTitle>Select Your Role</CardTitle>
            <CardDescription>
              Choose whether you&apos;re registering as a student or faculty member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div className="space-y-4">
                <RadioGroup
                  value={selectedRole}
                  onValueChange={(value) => setSelectedRole(value as UserRole)}
                  className="grid grid-cols-2 gap-4"
                >
                  <div>
                    <RadioGroupItem
                      value="student"
                      id="student"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="student"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-neural-primary [&:has([data-state=checked])]:border-neural-primary cursor-pointer"
                    >
                      <GraduationCap className="mb-3 h-6 w-6" />
                      <div className="text-center">
                        <div className="font-semibold">Student</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Enroll in courses and track progress
                        </div>
                      </div>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="faculty"
                      id="faculty"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="faculty"
                      className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-neural-primary [&:has([data-state=checked])]:border-neural-primary cursor-pointer"
                    >
                      <Users className="mb-3 h-6 w-6" />
                      <div className="text-center">
                        <div className="font-semibold">Faculty</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Create courses and manage content
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Common Fields */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={commonData.name}
                    onChange={handleCommonChange}
                    placeholder="Jane Smith"
                    required
                    disabled={isLoading}
                    className="border-neural-light/30 focus:border-neural-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={commonData.email}
                    onChange={handleCommonChange}
                    placeholder={
                      selectedRole === "student"
                        ? "student@example.com"
                        : "faculty@university.edu"
                    }
                    required
                    disabled={isLoading}
                    className="border-neural-light/30 focus:border-neural-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={commonData.password}
                      onChange={handleCommonChange}
                      placeholder="Create a strong password"
                      required
                      disabled={isLoading}
                      className="border-neural-light/30 focus:border-neural-primary pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be 8-128 characters with at least one uppercase letter, one
                    lowercase letter, one number, and one special character (@$!%*?&)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirm Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={commonData.confirmPassword}
                      onChange={handleCommonChange}
                      placeholder="Confirm your password"
                      required
                      disabled={isLoading}
                      className="border-neural-light/30 focus:border-neural-primary pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Role-Specific Fields */}
              {selectedRole === "student" && (
                <div className="space-y-4 pt-4 border-t border-neural-light/30">
                  <h3 className="text-lg font-semibold text-neural-primary">
                    Student Information
                  </h3>
                  <StudentRegistrationFields
                    formData={studentData}
                    onChange={handleStudentChange}
                    isLoading={isLoading}
                  />
                </div>
              )}

              {selectedRole === "faculty" && (
                <div className="space-y-4 pt-4 border-t border-neural-light/30">
                  <h3 className="text-lg font-semibold text-neural-primary">
                    Faculty Information
                  </h3>
                  <FacultyRegistrationFields
                    formData={facultyData}
                    email={commonData.email}
                    onChange={handleFacultyChange}
                    isLoading={isLoading}
                  />
                </div>
              )}

              <NeuralButton
                type="submit"
                variant="neural"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading
                  ? "Creating Account..."
                  : selectedRole === "student"
                  ? "Create Student Account"
                  : "Submit Faculty Request"}
              </NeuralButton>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-neural-primary hover:text-neural-deep transition-colors font-medium"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
