#!/usr/bin/env python3
"""
QuantTrade Streamlit Monitor Starter Script

This script helps you start the Streamlit monitoring dashboard
with proper environment setup and configuration.
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print("❌ Python 3.8 or higher is required")
        return False
    print(f"✅ Python {version.major}.{version.minor}.{version.micro} detected")
    return True

def check_virtual_environment():
    """Check if virtual environment exists"""
    venv_path = Path("streamlit-env")
    
    if platform.system() == "Windows":
        activate_script = venv_path / "Scripts" / "activate.bat"
        python_exe = venv_path / "Scripts" / "python.exe"
    else:
        activate_script = venv_path / "bin" / "activate"
        python_exe = venv_path / "bin" / "python"
    
    if not venv_path.exists():
        print("❌ Virtual environment not found")
        print("Creating virtual environment...")
        try:
            subprocess.run([sys.executable, "-m", "venv", "streamlit-env"], check=True)
            print("✅ Virtual environment created")
        except subprocess.CalledProcessError:
            print("❌ Failed to create virtual environment")
            return False, None, None
    else:
        print("✅ Virtual environment found")
    
    return True, activate_script, python_exe

def install_requirements(python_exe):
    """Install required packages"""
    requirements_file = Path("requirements.txt")
    
    if not requirements_file.exists():
        print("❌ requirements.txt not found")
        return False
    
    print("📦 Installing requirements...")
    try:
        subprocess.run([str(python_exe), "-m", "pip", "install", "-r", "requirements.txt"], check=True)
        print("✅ Requirements installed successfully")
        return True
    except subprocess.CalledProcessError:
        print("❌ Failed to install requirements")
        return False

def check_environment_file():
    """Check if .env file exists"""
    env_file = Path(".env")
    env_example = Path(".env.example")
    
    if not env_file.exists():
        if env_example.exists():
            print("⚠️  .env file not found. Copying from .env.example")
            try:
                env_file.write_text(env_example.read_text())
                print("✅ .env file created from template")
            except Exception as e:
                print(f"❌ Failed to create .env file: {e}")
                return False
        else:
            print("❌ Neither .env nor .env.example found")
            print("Please create a .env file with your configuration")
            return False
    else:
        print("✅ .env file found")
    
    return True

def start_streamlit(python_exe):
    """Start the Streamlit application"""
    app_file = Path("app.py")
    
    if not app_file.exists():
        print("❌ app.py not found")
        return False
    
    print("🚀 Starting Streamlit monitor...")
    print("📊 Dashboard will be available at: http://localhost:8501")
    print("🔄 Press Ctrl+C to stop")
    
    try:
        subprocess.run([str(python_exe), "-m", "streamlit", "run", "app.py"], check=True)
    except KeyboardInterrupt:
        print("\n⏹️  Streamlit monitor stopped")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start Streamlit: {e}")
        return False
    
    return True

def print_startup_info():
    """Print startup information"""
    print("="*60)
    print("🚀 QuantTrade Streamlit Monitor")
    print("="*60)
    print()

def print_usage_instructions():
    """Print usage instructions"""
    print("\n" + "="*60)
    print("📋 USAGE INSTRUCTIONS")
    print("="*60)
    print()
    print("1. 🌐 Open your browser and go to: http://localhost:8501")
    print("2. 🎛️  Use the sidebar to configure environment settings")
    print("3. 📊 Navigate through different monitoring tabs:")
    print("   • 🏠 Overview - System status and health")
    print("   • 📊 API Monitor - API endpoint testing")
    print("   • 💾 Database - Database monitoring and queries")
    print("   • 📈 Trading - Backtesting and analytics")
    print()
    print("4. 🔄 Enable auto-refresh for real-time monitoring")
    print("5. ⚙️  Configure your services in the .env file")
    print()
    print("📝 BEFORE USING:")
    print("   • Ensure your QuantTrade services are running")
    print("   • Update .env file with correct URLs")
    print("   • Check database connection settings")
    print()

def main():
    """Main function"""
    print_startup_info()
    
    # Check Python version
    if not check_python_version():
        return 1
    
    # Check virtual environment
    venv_ok, activate_script, python_exe = check_virtual_environment()
    if not venv_ok:
        return 1
    
    # Install requirements
    if not install_requirements(python_exe):
        return 1
    
    # Check environment file
    if not check_environment_file():
        return 1
    
    print_usage_instructions()
    
    # Start Streamlit
    input("\n⏸️  Press Enter to start the Streamlit monitor...")
    
    if not start_streamlit(python_exe):
        return 1
    
    print("✅ Streamlit monitor setup complete!")
    return 0

if __name__ == "__main__":
    sys.exit(main())