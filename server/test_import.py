import traceback

with open("error_msg.txt", "w", encoding="utf-8") as f:
    try:
        import system_settings_engine
        import main
        f.write("SUCCESS: SYSTEM SETTINGS & ALL ENGINES OK!")
    except Exception as e:
        f.write(f"EXC: {repr(e)}\n\n")
        f.write(traceback.format_exc())
