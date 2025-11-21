"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MAJORS } from "@/lib/constants/majors";
import { ACADEMIC_INTERESTS } from "@/lib/constants/academic-interests";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useState } from "react";

interface StudentRegistrationFieldsProps {
  formData: {
    major: string;
    graduation_year: string;
    academic_interests: string[];
  };
  onChange: (field: string, value: any) => void;
  isLoading: boolean;
}

export function StudentRegistrationFields({
  formData,
  onChange,
  isLoading,
}: StudentRegistrationFieldsProps) {
  const [interestInput, setInterestInput] = useState("");
  const [showInterestSuggestions, setShowInterestSuggestions] = useState(false);

  // Generate graduation year options (current year to current year + 10)
  const currentYear = new Date().getFullYear();
  const graduationYears = Array.from({ length: 11 }, (_, i) => currentYear + i);

  // Filter interests based on input
  const filteredInterests = ACADEMIC_INTERESTS.filter(
    (interest) =>
      interest.toLowerCase().includes(interestInput.toLowerCase()) &&
      !formData.academic_interests.includes(interest)
  ).slice(0, 10); // Show max 10 suggestions

  const addInterest = (interest: string) => {
    if (!formData.academic_interests.includes(interest)) {
      onChange("academic_interests", [...formData.academic_interests, interest]);
    }
    setInterestInput("");
    setShowInterestSuggestions(false);
  };

  const removeInterest = (interest: string) => {
    onChange(
      "academic_interests",
      formData.academic_interests.filter((i) => i !== interest)
    );
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="major">
          Major <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.major}
          onValueChange={(value) => onChange("major", value)}
          disabled={isLoading}
          required
        >
          <SelectTrigger className="border-neural-light/30 focus:border-neural-primary">
            <SelectValue placeholder="Select your major" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {MAJORS.map((major) => (
              <SelectItem key={major} value={major}>
                {major}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Your primary field of study
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="graduation_year">
          Expected Graduation Year <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.graduation_year}
          onValueChange={(value) => onChange("graduation_year", value)}
          disabled={isLoading}
          required
        >
          <SelectTrigger className="border-neural-light/30 focus:border-neural-primary">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {graduationYears.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          When do you plan to graduate?
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="academic_interests">
          Academic Interests <span className="text-muted-foreground text-xs">(Optional)</span>
        </Label>
        <div className="relative">
          <Input
            id="academic_interests"
            type="text"
            value={interestInput}
            onChange={(e) => {
              setInterestInput(e.target.value);
              setShowInterestSuggestions(e.target.value.length > 0);
            }}
            onFocus={() => setShowInterestSuggestions(interestInput.length > 0)}
            placeholder="Type to search interests..."
            disabled={isLoading}
            className="border-neural-light/30 focus:border-neural-primary"
          />
          {showInterestSuggestions && filteredInterests.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-background border border-neural-light/30 rounded-md shadow-lg max-h-48 overflow-auto">
              {filteredInterests.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => addInterest(interest)}
                  className="w-full px-3 py-2 text-left hover:bg-neural-light/10 transition-colors text-sm"
                >
                  {interest}
                </button>
              ))}
            </div>
          )}
        </div>

        {formData.academic_interests.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.academic_interests.map((interest) => (
              <Badge
                key={interest}
                variant="secondary"
                className="pl-3 pr-1 py-1"
              >
                {interest}
                <button
                  type="button"
                  onClick={() => removeInterest(interest)}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                  disabled={isLoading}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Select your areas of academic interest (e.g., AI, Neuroscience, Psychology)
        </p>
      </div>
    </>
  );
}
