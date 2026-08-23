import yaml
import sys

try:
    with open('docker-compose.prod.yml', 'r') as f:
        data = yaml.safe_load(f)
    print("✓ YAML is valid")
    print("Services:", sorted(data.get('services', {}).keys()))
    frontend = data.get('services', {}).get('frontend', {})
    print("Frontend volumes:", frontend.get('volumes', []))
    print("Frontend environment keys:", sorted(frontend.get('environment', {}).keys()))
    sys.exit(0)
except Exception as e:
    print("✗ YAML parse error:", str(e))
    sys.exit(1)
