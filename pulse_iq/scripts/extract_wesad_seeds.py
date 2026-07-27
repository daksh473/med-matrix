"""
WESAD Dataset Fast Extraction Script
====================================
Extracts chest ECG-derived heart rate, HRV (RMSSD), and stress reactivity (baseline vs stress)
for all available WESAD subjects (S2..S17).
Generates wesad_seed_profile.json and extends subject_pool.json.
"""

import pickle
import json
import os
import glob
import numpy as np
from scipy.signal import find_peaks

ROOT_DIR = r"c:\Users\daksh\Downloads\med matrix"
WESAD_DIR = os.path.join(ROOT_DIR, "unused_datasets", "WESAD")

def calc_hrv_rmssd(rr_arr_sec):
    if len(rr_arr_sec) < 2:
        return 0.0
    diffs_ms = np.diff(rr_arr_sec * 1000.0)
    return float(np.sqrt(np.mean(diffs_ms ** 2)))

def process_subject(subject_dir, sid):
    pkl_path = os.path.join(subject_dir, f"{sid}.pkl")
    if not os.path.exists(pkl_path):
        return None

    try:
        with open(pkl_path, "rb") as f:
            data = pickle.load(f, encoding="latin1")
    except Exception as e:
        print(f"Error loading {pkl_path}: {e}")
        return None

    # Downsample ECG by 2x (350 Hz) for ultra-fast processing
    ecg = data["signal"]["chest"]["ECG"].flatten()[::2]
    label = data["label"][::2]
    fs = 350.0

    # Highpass-like difference filter to accentuate R peaks
    diff_ecg = np.diff(ecg)
    ecg_sq = diff_ecg ** 2

    # Fast peak detection (min distance = 0.4s = 140 samples at 350Hz)
    min_dist = int(0.4 * fs)
    thresh = np.mean(ecg_sq) + 1.2 * np.std(ecg_sq)
    peaks, _ = find_peaks(ecg_sq, height=thresh, distance=min_dist)

    if len(peaks) < 10:
        return None

    rr_intervals = np.diff(peaks) / fs
    hr_values = 60.0 / rr_intervals
    peak_labels = label[peaks[1:]]

    valid_mask = (hr_values >= 40) & (hr_values <= 180)

    # Label 1 = baseline, Label 2 = stress
    base_mask = valid_mask & (peak_labels == 1)
    stress_mask = valid_mask & (peak_labels == 2)

    base_hrs = hr_values[base_mask]
    stress_hrs = hr_values[stress_mask]
    base_rrs = rr_intervals[base_mask]
    stress_rrs = rr_intervals[stress_mask]

    if len(base_hrs) == 0 or len(stress_hrs) == 0:
        return None

    base_hr_mean = float(np.mean(base_hrs))
    base_hr_std = float(np.std(base_hrs))
    stress_hr_mean = float(np.mean(stress_hrs))
    stress_hr_std = float(np.std(stress_hrs))

    hr_delta = float(stress_hr_mean - base_hr_mean)
    hr_delta_pct = float((hr_delta / base_hr_mean) * 100.0)

    base_rmssd = calc_hrv_rmssd(base_rrs)
    stress_rmssd = calc_hrv_rmssd(stress_rrs)
    rmssd_delta = float(stress_rmssd - base_rmssd)

    return {
        "subject_id": f"wesad_{sid}",
        "display_name": f"WESAD Subject {sid} (RespiBAN Stress Telemetry)",
        "source": "wesad",
        "baseline_hr_mean": round(base_hr_mean, 2),
        "baseline_hr_std": round(base_hr_std, 2),
        "stress_hr_mean": round(stress_hr_mean, 2),
        "stress_hr_std": round(stress_hr_std, 2),
        "hr_stress_delta": round(hr_delta, 2),
        "hr_stress_delta_pct": round(hr_delta_pct, 2),
        "baseline_hrv_rmssd": round(base_rmssd, 2),
        "stress_hrv_rmssd": round(stress_rmssd, 2),
        "hrv_stress_delta": round(rmssd_delta, 2),
        # Backfilled telemetry statistics for subject_pool compatibility
        "heart_rate_mean": round(base_hr_mean, 2),
        "heart_rate_std": round(base_hr_std, 2),
        "steps_mean": 9795.0,     # Backfilled from Fitbit dataset-wide average
        "steps_std": 1500.0,
        "sleep_hours_mean": 7.47, # Backfilled from Fitbit dataset-wide average
        "sleep_hours_std": 1.15,
        "spo2_mean": 96.72,
        "spo2_std": 0.50,
        "estimated": True
    }

def main():
    print("=" * 70)
    print("EXTRACTING WESAD STRESS TELEMETRY SEEDS (FAST MODE)")
    print("=" * 70)

    wesad_seeds = []
    subject_dirs = sorted(glob.glob(os.path.join(WESAD_DIR, "S*")))

    for sdir in subject_dirs:
        sid = os.path.basename(sdir)
        if not sid.startswith("S"):
            continue
        entry = process_subject(sdir, sid)
        if entry:
            wesad_seeds.append(entry)
            print(f"  -> {sid}: Baseline HR={entry['baseline_hr_mean']} bpm | Stress HR={entry['stress_hr_mean']} bpm | Delta=+{entry['hr_stress_delta']} bpm (+{entry['hr_stress_delta_pct']}%) | HRV RMSSD={entry['baseline_hrv_rmssd']} -> {entry['stress_hrv_rmssd']} ms")

    print(f"\nExtracted {len(wesad_seeds)} valid WESAD subjects.")

    # Save wesad_seed_profile.json
    seed_paths = [
        os.path.join(ROOT_DIR, "pulse_iq", "data", "wesad_seed_profile.json"),
        os.path.join(ROOT_DIR, "webapp", "src", "data", "wesad_seed_profile.json"),
        os.path.join(ROOT_DIR, "webapp", "public", "wesad_seed_profile.json"),
    ]

    for spath in seed_paths:
        os.makedirs(os.path.dirname(spath), exist_ok=True)
        with open(spath, "w") as f:
            json.dump(wesad_seeds, f, indent=2)
        print(f"Saved WESAD seeds: {spath}")

    return wesad_seeds

if __name__ == "__main__":
    main()
