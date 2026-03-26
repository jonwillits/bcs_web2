'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

interface AssessmentSettings {
  time_limit_minutes: number | null;
  max_attempts: number;
  pass_threshold: number;
  scoring_procedure: string;
  scoring_drop_count: number;
  feedback_timing: string;
  feedback_depth: string;
  xp_reward: number;
  randomize_blocks: boolean;
}

interface AssessmentSettingsFormProps {
  settings: AssessmentSettings;
  onChange: (settings: AssessmentSettings) => void;
}

export function AssessmentSettingsForm({ settings, onChange }: AssessmentSettingsFormProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Time Limit */}
        <div>
          <Label className="text-xs">Time Limit (minutes)</Label>
          <Input
            type="number"
            min={1}
            value={settings.time_limit_minutes ?? ''}
            onChange={(e) => {
              const val = e.target.value ? parseInt(e.target.value) : null;
              onChange({ ...settings, time_limit_minutes: val });
            }}
            placeholder="No limit"
            className="mt-1"
          />
        </div>

        {/* Max Attempts */}
        <div>
          <Label className="text-xs">Max Attempts</Label>
          <Input
            type="number"
            min={0}
            value={settings.max_attempts}
            onChange={(e) => onChange({ ...settings, max_attempts: parseInt(e.target.value) || 0 })}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">0 = unlimited</p>
        </div>

        {/* Pass Threshold */}
        <div>
          <Label className="text-xs">Pass Threshold (%)</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={settings.pass_threshold}
            onChange={(e) => onChange({ ...settings, pass_threshold: parseInt(e.target.value) || 70 })}
            className="mt-1"
          />
        </div>

        {/* XP Reward */}
        <div>
          <Label className="text-xs">XP Reward</Label>
          <Input
            type="number"
            min={0}
            max={10000}
            value={settings.xp_reward}
            onChange={(e) => onChange({ ...settings, xp_reward: parseInt(e.target.value) || 50 })}
            className="mt-1"
          />
        </div>
      </div>

      {/* Scoring Procedure */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Scoring Procedure</Label>
          <Select
            value={settings.scoring_procedure}
            onValueChange={(v) => onChange({ ...settings, scoring_procedure: v })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="best">Best Score</SelectItem>
              <SelectItem value="last">Last Attempt</SelectItem>
              <SelectItem value="average_drop_n">Average (drop lowest N)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {settings.scoring_procedure === 'average_drop_n' && (
          <div>
            <Label className="text-xs">Drop Lowest N</Label>
            <Input
              type="number"
              min={0}
              value={settings.scoring_drop_count}
              onChange={(e) => onChange({ ...settings, scoring_drop_count: parseInt(e.target.value) || 0 })}
              className="mt-1"
            />
          </div>
        )}
      </div>

      {/* Feedback Settings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Feedback Timing</Label>
          <Select
            value={settings.feedback_timing}
            onValueChange={(v) => onChange({ ...settings, feedback_timing: v })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="per_question">After Each Question</SelectItem>
              <SelectItem value="after_quiz">After Quiz Submission</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs">Feedback Depth</Label>
          <Select
            value={settings.feedback_depth}
            onValueChange={(v) => onChange({ ...settings, feedback_depth: v })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full (correct answers + explanations)</SelectItem>
              <SelectItem value="which_wrong">Which Questions Wrong</SelectItem>
              <SelectItem value="score_only">Score Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Randomize blocks */}
      <div className="flex items-center gap-2">
        <Switch
          checked={settings.randomize_blocks}
          onCheckedChange={(v) => onChange({ ...settings, randomize_blocks: v })}
        />
        <Label className="text-xs">Randomize block order</Label>
      </div>
    </div>
  );
}
