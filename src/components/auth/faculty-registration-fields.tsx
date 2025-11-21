"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FACULTY_TITLES } from "@/lib/constants/faculty-titles";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isUniversityEmail } from "@/lib/auth/utils";

interface FacultyRegistrationFieldsProps {
  formData: {
    university: string;
    department: string;
    title: string;
    research_area: string;
    personal_website_url: string;
    request_statement: string;
  };
  email: string; // For email validation warning
  onChange: (field: string, value: string) => void;
  isLoading: boolean;
}

export function FacultyRegistrationFields({
  formData,
  email,
  onChange,
  isLoading,
}: FacultyRegistrationFieldsProps) {
  const showEmailWarning = email && !isUniversityEmail(email);

  return (
    <>
      {showEmailWarning && (
        <Alert variant="default" className="border-yellow-500/50 bg-yellow-500/5">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-300">
            Faculty accounts typically use university email addresses (.edu domain).
            Your request may require additional verification.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="university">
          University <span className="text-red-500">*</span>
        </Label>
        <Input
          id="university"
          name="university"
          type="text"
          value={formData.university}
          onChange={(e) => onChange("university", e.target.value)}
          placeholder="University of Illinois"
          required
          disabled={isLoading}
          className="border-neural-light/30 focus:border-neural-primary"
        />
        <p className="text-xs text-muted-foreground">
          The institution you are affiliated with
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="department">
          Department <span className="text-red-500">*</span>
        </Label>
        <Input
          id="department"
          name="department"
          type="text"
          value={formData.department}
          onChange={(e) => onChange("department", e.target.value)}
          placeholder="Brain and Cognitive Science"
          required
          disabled={isLoading}
          className="border-neural-light/30 focus:border-neural-primary"
        />
        <p className="text-xs text-muted-foreground">
          Your academic department
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">
          Title/Position <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.title}
          onValueChange={(value) => onChange("title", value)}
          disabled={isLoading}
          required
        >
          <SelectTrigger className="border-neural-light/30 focus:border-neural-primary">
            <SelectValue placeholder="Select your title" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {FACULTY_TITLES.map((title) => (
              <SelectItem key={title} value={title}>
                {title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Your academic position (e.g., Professor, Lecturer)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="research_area">
          Research Area/Speciality <span className="text-red-500">*</span>
        </Label>
        <Input
          id="research_area"
          name="research_area"
          type="text"
          value={formData.research_area}
          onChange={(e) => onChange("research_area", e.target.value)}
          placeholder="Computational Neuroscience"
          required
          disabled={isLoading}
          className="border-neural-light/30 focus:border-neural-primary"
        />
        <p className="text-xs text-muted-foreground">
          Your primary area of research or teaching
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="personal_website_url">
          Personal/Academic Website{" "}
          <span className="text-muted-foreground text-xs">(Optional)</span>
        </Label>
        <Input
          id="personal_website_url"
          name="personal_website_url"
          type="url"
          value={formData.personal_website_url}
          onChange={(e) => onChange("personal_website_url", e.target.value)}
          placeholder="https://example.edu/~faculty"
          disabled={isLoading}
          className="border-neural-light/30 focus:border-neural-primary"
        />
        <p className="text-xs text-muted-foreground">
          Your personal or departmental website (helps verify your credentials)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="request_statement">
          Statement <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="request_statement"
          name="request_statement"
          value={formData.request_statement}
          onChange={(e) => onChange("request_statement", e.target.value)}
          placeholder="Please tell us why you need faculty access. Include information about your teaching responsibilities and how you plan to use this platform..."
          required
          disabled={isLoading}
          className="border-neural-light/30 focus:border-neural-primary min-h-[120px]"
          minLength={50}
        />
        <p className="text-xs text-muted-foreground">
          Please explain why you need faculty access and how you plan to use the
          platform (minimum 50 characters). This helps us verify your request.
        </p>
        {formData.request_statement.length > 0 && (
          <p
            className={`text-xs ${
              formData.request_statement.length >= 50
                ? "text-green-600"
                : "text-yellow-600"
            }`}
          >
            {formData.request_statement.length}/50 characters
          </p>
        )}
      </div>

      <Alert variant="default" className="border-blue-500/50 bg-blue-500/5">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm">
          <strong>Faculty Approval Process:</strong> Your request will be reviewed
          by an administrator. You will receive an email notification once your
          request has been approved or if additional information is needed.
        </AlertDescription>
      </Alert>
    </>
  );
}
