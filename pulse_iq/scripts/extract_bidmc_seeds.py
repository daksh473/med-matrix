import os
import json
import pandas as pd
import numpy as np

def extract_bidmc_seeds():
    bidmc_csv_dir = r'c:\Users\daksh\Downloads\med matrix\unused_datasets\bidmc-ppg-and-respiration-dataset-1.0.0\bidmc_csv'
    if not os.path.exists(bidmc_csv_dir):
        print(f"Directory not found: {bidmc_csv_dir}")
        return

    numerics_files = sorted([f for f in os.listdir(bidmc_csv_dir) if f.endswith('_Numerics.csv')])
    print(f"Found {len(numerics_files)} BIDMC numerics files.")

    seed_profiles = []

    for fname in numerics_files:
        subject_num = fname.split('_')[1]
        subject_id = f"bidmc_{subject_num}"
        fpath = os.path.join(bidmc_csv_dir, fname)

        try:
            df = pd.read_csv(fpath)
            # Find SpO2 column
            spo2_col = [c for c in df.columns if 'spo2' in c.lower()]
            hr_col = [c for c in df.columns if 'hr' in c.lower() or 'pulse' in c.lower()]

            if not spo2_col:
                continue

            col_name = spo2_col[0]
            spo2_series = pd.to_numeric(df[col_name], errors='coerce').dropna()
            
            # Filter physiological SpO2 values (70% - 100%)
            valid_spo2 = spo2_series[(spo2_series >= 70) & (spo2_series <= 100)].values

            if len(valid_spo2) < 30:
                continue

            spo2_mean = float(np.mean(valid_spo2))
            spo2_std = float(np.std(valid_spo2))
            
            # Average absolute difference between consecutive readings
            noise_mag = float(np.mean(np.abs(np.diff(valid_spo2))))

            # Optional HR extraction if available
            hr_mean = 75.0
            if hr_col:
                hr_series = pd.to_numeric(df[hr_col[0]], errors='coerce').dropna()
                valid_hr = hr_series[(hr_series >= 40) & (hr_series <= 180)].values
                if len(valid_hr) > 0:
                    hr_mean = float(np.mean(valid_hr))

            profile = {
                "subject_id": subject_id,
                "display_name": f"BIDMC Patient #{subject_num}",
                "source": "bidmc",
                "spo2_mean": round(spo2_mean, 2),
                "spo2_std": round(max(0.2, spo2_std), 2),
                "spo2_noise_magnitude": round(noise_mag, 2),
                "spo2_min": round(float(np.min(valid_spo2)), 1),
                "spo2_max": round(float(np.max(valid_spo2)), 1),
                "duration_seconds": len(valid_spo2),
                "heart_rate_mean": round(hr_mean, 1),
                "estimated": True
            }

            seed_profiles.append(profile)
        except Exception as err:
            print(f"Error processing {fname}: {err}")

    print(f"Extracted {len(seed_profiles)} BIDMC subject seed profiles.")

    # Save to multiple target locations
    target_paths = [
        r'c:\Users\daksh\Downloads\med matrix\pulse_iq\data\bidmc_seed_profiles.json',
        r'c:\Users\daksh\Downloads\med matrix\webapp\src\data\bidmc_seed_profiles.json',
        r'c:\Users\daksh\Downloads\med matrix\webapp\public\bidmc_seed_profiles.json',
        r'c:\Users\daksh\Downloads\med matrix\bidmc_seed_profiles.json'
    ]

    for tpath in target_paths:
        os.makedirs(os.path.dirname(tpath), exist_ok=True)
        with open(tpath, 'w') as f:
            json.dump(seed_profiles, f, indent=2)
        print(f"Saved {tpath}")

if __name__ == '__main__':
    extract_bidmc_seeds()
