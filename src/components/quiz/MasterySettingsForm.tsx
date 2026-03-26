'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface MasterySettings {
  mastery_threshold: number;
  xp_reward: number;
}

interface MasterySettingsFormProps {
  settings: MasterySettings;
  onChange: (settings: MasterySettings) => void;
}

export function MasterySettingsForm({ settings, onChange }: MasterySettingsFormProps) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Mastery checks always have unlimited attempts, per-question feedback, and full explanation depth.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs">Mastery Threshold (%)</Label>
          <Input
            type="number"
            min={1}
            max={100}
            value={settings.mastery_threshold}
            onChange={(e) => onChange({ ...settings, mastery_threshold: parseInt(e.target.value) || 80 })}
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Weighted score needed to count as mastered
          </p>
        </div>

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
          <p className="text-xs text-muted-foreground mt-1">
            Awarded on first mastery only
          </p>
        </div>
      </div>
    </div>
  );
}
