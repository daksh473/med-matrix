import os
import json

def merge_subject_pool():
    # 1. Check SHHS status
    shhs_dir = r'c:\Users\daksh\Downloads\med matrix\unused_datasets\sleep-heart-health-study-psg-database-1.0.0'
    has_shhs_summary = False
    if os.path.exists(shhs_dir):
        files = os.listdir(shhs_dir)
        summary_csvs = [f for f in files if f.endswith('.csv') and 'summary' in f.lower()]
        if summary_csvs:
            has_shhs_summary = True

    if not has_shhs_summary:
        print("SHHS only contains raw EDF signal files, no subject-level summary available — skipping SHHS integration, existing Fitbit-derived sleep seed remains the sleep_hours source")

    # 2. Load existing subject_pool.json
    base_pool_path = r'c:\Users\daksh\Downloads\med matrix\webapp\public\subject_pool.json'
    if not os.path.exists(base_pool_path):
        base_pool_path = r'c:\Users\daksh\Downloads\med matrix\pulse_iq\data\subject_pool.json'

    with open(base_pool_path, 'r') as f:
        existing_pool = json.load(f)

    # Filter out any prior bidmc/shhs entries if re-running
    base_subjects = [s for s in existing_pool if s.get('source') not in ('bidmc', 'shhs')]

    # 3. Load extracted bidmc_seed_profiles.json
    bidmc_profiles_path = r'c:\Users\daksh\Downloads\med matrix\pulse_iq\data\bidmc_seed_profiles.json'
    bidmc_entries = []
    if os.path.exists(bidmc_profiles_path):
        with open(bidmc_profiles_path, 'r') as f:
            bidmc_raw = json.load(f)
        
        for item in bidmc_raw:
            entry = {
                "source": "bidmc",
                "subject_id": item["subject_id"],
                "display_name": item["display_name"],
                "spo2_mean": item["spo2_mean"],
                "spo2_std": item["spo2_std"],
                "spo2_noise_magnitude": item.get("spo2_noise_magnitude", 0.2),
                "spo2_min": item.get("spo2_min", 94.0),
                "spo2_max": item.get("spo2_max", 99.0),
                # Backfilled Fitbit-wide defaults
                "heart_rate_mean": item.get("heart_rate_mean", 75.0),
                "heart_rate_std": 10.5,
                "steps_mean": 9800.0,
                "steps_std": 1800.0,
                "sleep_hours_mean": 7.4,
                "sleep_hours_std": 1.2,
                "estimated": True
            }
            bidmc_entries.append(entry)

    # 4. Merge pools
    merged_pool = base_subjects + bidmc_entries

    print(f"\nSubject Pool Merge Results:")
    print(f"- Base subjects (Fitbit / PPG-DaLiA / WESAD): {len(base_subjects)}")
    print(f"- BIDMC subjects added: {len(bidmc_entries)}")
    print(f"- Total subjects in merged pool: {len(merged_pool)}")

    breakdown = {}
    for s in merged_pool:
        src = s.get('source', 'unknown')
        breakdown[src] = breakdown.get(src, 0) + 1
    print(f"- Updated Source Breakdown: {breakdown}")

    # 5. Save merged subject_pool.json to all targets
    targets = [
        r'c:\Users\daksh\Downloads\med matrix\pulse_iq\data\subject_pool.json',
        r'c:\Users\daksh\Downloads\med matrix\webapp\src\data\subject_pool.json',
        r'c:\Users\daksh\Downloads\med matrix\webapp\public\subject_pool.json',
        r'c:\Users\daksh\Downloads\med matrix\subject_pool.json'
    ]

    for t in targets:
        os.makedirs(os.path.dirname(t), exist_ok=True)
        with open(t, 'w') as f:
            json.dump(merged_pool, f, indent=2)
        print(f"Saved merged pool to {t}")

if __name__ == '__main__':
    merge_subject_pool()
