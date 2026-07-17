from db_helper import delete_old_chat_history, delete_old_sessions

if __name__ == "__main__":
    chat_deleted = delete_old_chat_history(4)
    # session_deleted = delete_old_sessions(4)
    print(f"Deleted {chat_deleted} chat records.")