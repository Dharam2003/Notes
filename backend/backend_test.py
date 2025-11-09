import requests
import sys
import os
from datetime import datetime
import io

class StudyVaultAPITester:
    def __init__(self, base_url="https://notes-checker.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_note_id = None
        self.test_file_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = headers or {}
        
        if self.token and 'Authorization' not in test_headers:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers=test_headers, timeout=10)
                else:
                    test_headers['Content-Type'] = 'application/json'
                    response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                test_headers['Content-Type'] = 'application/json'
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_login_correct_password(self):
        """Test login with correct password"""
        success, response = self.run_test(
            "Admin Login (Correct Password)",
            "POST",
            "auth/login",
            200,
            data={"password": "Dharam@2003"}
        )
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   Token received: {self.token[:20]}...")
            return True
        return False

    def test_login_incorrect_password(self):
        """Test login with incorrect password"""
        success, response = self.run_test(
            "Admin Login (Incorrect Password)",
            "POST",
            "auth/login",
            401,
            data={"password": "WrongPassword123"}
        )
        return success

    def test_get_categories(self):
        """Test getting categories"""
        success, response = self.run_test(
            "Get Categories",
            "GET",
            "categories",
            200
        )
        if success and 'categories' in response:
            print(f"   Categories: {response['categories']}")
            return True
        return False

    def test_upload_note(self):
        """Test uploading a PDF note"""
        # Create a dummy PDF file
        pdf_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 4 0 R\n>>\n>>\n/MediaBox [0 0 612 792]\n/Contents 5 0 R\n>>\nendobj\n4 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n5 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Test PDF) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000262 00000 n\n0000000341 00000 n\ntrailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n433\n%%EOF"
        
        files = {
            'file': ('test_note.pdf', io.BytesIO(pdf_content), 'application/pdf')
        }
        data = {
            'title': 'Test Mathematics Note',
            'description': 'This is a test note for mathematics',
            'category': 'Mathematics'
        }
        
        success, response = self.run_test(
            "Upload PDF Note",
            "POST",
            "notes/upload",
            200,
            data=data,
            files=files
        )
        if success and 'note_id' in response:
            self.test_note_id = response['note_id']
            print(f"   Note ID: {self.test_note_id}")
            return True
        return False

    def test_get_all_notes(self):
        """Test getting all notes"""
        success, response = self.run_test(
            "Get All Notes",
            "GET",
            "notes",
            200
        )
        if success and isinstance(response, list):
            print(f"   Total notes: {len(response)}")
            if len(response) > 0:
                print(f"   First note: {response[0].get('title', 'N/A')}")
            return True
        return False

    def test_filter_by_category(self):
        """Test filtering notes by category"""
        success, response = self.run_test(
            "Filter Notes by Category",
            "GET",
            "notes?category=Mathematics",
            200
        )
        if success and isinstance(response, list):
            print(f"   Mathematics notes: {len(response)}")
            return True
        return False

    def test_sort_by_date_desc(self):
        """Test sorting notes by date descending"""
        success, response = self.run_test(
            "Sort Notes by Date (Newest First)",
            "GET",
            "notes?sort_by=date_desc",
            200
        )
        return success

    def test_sort_by_date_asc(self):
        """Test sorting notes by date ascending"""
        success, response = self.run_test(
            "Sort Notes by Date (Oldest First)",
            "GET",
            "notes?sort_by=date_asc",
            200
        )
        return success

    def test_sort_by_name_asc(self):
        """Test sorting notes by name ascending"""
        success, response = self.run_test(
            "Sort Notes by Name (A to Z)",
            "GET",
            "notes?sort_by=name_asc",
            200
        )
        return success

    def test_sort_by_name_desc(self):
        """Test sorting notes by name descending"""
        success, response = self.run_test(
            "Sort Notes by Name (Z to A)",
            "GET",
            "notes?sort_by=name_desc",
            200
        )
        return success

    def test_sort_by_category(self):
        """Test sorting notes by category"""
        success, response = self.run_test(
            "Sort Notes by Category",
            "GET",
            "notes?sort_by=category",
            200
        )
        return success

    def test_get_single_note(self):
        """Test getting a single note by ID"""
        if not self.test_note_id:
            print("⚠️  Skipping - No test note ID available")
            return True
        
        success, response = self.run_test(
            "Get Single Note",
            "GET",
            f"notes/{self.test_note_id}",
            200
        )
        if success:
            print(f"   Note title: {response.get('title', 'N/A')}")
            self.test_file_id = response.get('pdf_file_id')
            print(f"   PDF File ID: {self.test_file_id}")
            return True
        return False

    def test_get_pdf(self):
        """Test getting PDF file"""
        if not self.test_file_id:
            print("⚠️  Skipping - No test file ID available")
            return True
        
        url = f"{self.base_url}/pdf/{self.test_file_id}"
        print(f"\n🔍 Testing Get PDF File...")
        self.tests_run += 1
        
        try:
            response = requests.get(url, timeout=10)
            if response.status_code == 200 and response.headers.get('content-type') == 'application/pdf':
                self.tests_passed += 1
                print(f"✅ Passed - PDF retrieved successfully")
                print(f"   Content-Type: {response.headers.get('content-type')}")
                print(f"   Size: {len(response.content)} bytes")
                return True
            else:
                print(f"❌ Failed - Status: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False

    def test_update_note(self):
        """Test updating a note"""
        if not self.test_note_id:
            print("⚠️  Skipping - No test note ID available")
            return True
        
        success, response = self.run_test(
            "Update Note",
            "PUT",
            f"notes/{self.test_note_id}",
            200,
            data={
                "title": "Updated Test Note",
                "description": "Updated description",
                "category": "Science"
            }
        )
        return success

    def test_delete_note(self):
        """Test deleting a note"""
        if not self.test_note_id:
            print("⚠️  Skipping - No test note ID available")
            return True
        
        success, response = self.run_test(
            "Delete Note",
            "DELETE",
            f"notes/{self.test_note_id}",
            200
        )
        return success

    def test_upload_without_auth(self):
        """Test uploading without authentication"""
        pdf_content = b"%PDF-1.4\nTest"
        files = {
            'file': ('test.pdf', io.BytesIO(pdf_content), 'application/pdf')
        }
        data = {
            'title': 'Unauthorized Test',
            'description': 'Should fail',
            'category': 'Mathematics'
        }
        
        # Temporarily remove token
        temp_token = self.token
        self.token = None
        
        success, response = self.run_test(
            "Upload Without Auth (Should Fail)",
            "POST",
            "notes/upload",
            403,
            data=data,
            files=files
        )
        
        # Restore token
        self.token = temp_token
        return success

    def test_invalid_category(self):
        """Test uploading with invalid category"""
        pdf_content = b"%PDF-1.4\nTest"
        files = {
            'file': ('test.pdf', io.BytesIO(pdf_content), 'application/pdf')
        }
        data = {
            'title': 'Invalid Category Test',
            'description': 'Should fail',
            'category': 'InvalidCategory'
        }
        
        success, response = self.run_test(
            "Upload with Invalid Category (Should Fail)",
            "POST",
            "notes/upload",
            400,
            data=data,
            files=files
        )
        return success

def main():
    print("=" * 60)
    print("Study Vault API Testing")
    print("=" * 60)
    
    tester = StudyVaultAPITester()
    
    # Authentication Tests
    print("\n" + "=" * 60)
    print("AUTHENTICATION TESTS")
    print("=" * 60)
    tester.test_login_incorrect_password()
    if not tester.test_login_correct_password():
        print("\n❌ Login failed, stopping tests")
        return 1
    
    # Category Tests
    print("\n" + "=" * 60)
    print("CATEGORY TESTS")
    print("=" * 60)
    tester.test_get_categories()
    
    # Upload Tests
    print("\n" + "=" * 60)
    print("UPLOAD TESTS")
    print("=" * 60)
    tester.test_upload_note()
    tester.test_upload_without_auth()
    tester.test_invalid_category()
    
    # Retrieval Tests
    print("\n" + "=" * 60)
    print("RETRIEVAL TESTS")
    print("=" * 60)
    tester.test_get_all_notes()
    tester.test_get_single_note()
    tester.test_get_pdf()
    
    # Filter and Sort Tests
    print("\n" + "=" * 60)
    print("FILTER AND SORT TESTS")
    print("=" * 60)
    tester.test_filter_by_category()
    tester.test_sort_by_date_desc()
    tester.test_sort_by_date_asc()
    tester.test_sort_by_name_asc()
    tester.test_sort_by_name_desc()
    tester.test_sort_by_category()
    
    # Update and Delete Tests
    print("\n" + "=" * 60)
    print("UPDATE AND DELETE TESTS")
    print("=" * 60)
    tester.test_update_note()
    tester.test_delete_note()
    
    # Print results
    print("\n" + "=" * 60)
    print("TEST RESULTS")
    print("=" * 60)
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())
