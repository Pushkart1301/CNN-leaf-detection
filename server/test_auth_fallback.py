import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(__file__))

import db_mongo


class AuthFallbackTests(unittest.TestCase):
    def setUp(self):
        db_mongo._memory_store["users"] = []
        db_mongo.mongo_client = None
        db_mongo.db = None

    def test_demo_user_can_sign_in_without_mongodb(self):
        user = db_mongo.authenticate_user("demo", "demo12345")
        self.assertEqual(user["username"], "demo")
        self.assertEqual(user["email"], "demo@agritech.com")


if __name__ == "__main__":
    unittest.main()
