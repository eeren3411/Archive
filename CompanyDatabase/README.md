# CompanyDatabase

This is a miniproject which targets to store the company information with fake names and even with additional information. 
By the day I write this README, I am yet to write any frotend. So here is the backend documentation.

TODO: SessionID is set as cookie at authentication routes. I maybe should have mentioned it at the documentation. 
TODO: Some JSDocs in the api still missing some information. Mostly return res.cookie and a little bit of everything at auth endpoints.

---

## Backend

### Main Router
- **Method**: `GET`
- **Endpoint**: `/main`
- **Description**: Serves the main website.

---

### Authentication Routes

#### Create Database Entry
- **Method**: `POST`
- **Endpoint**: `/api/auth/create`
- **Request Body**:
  - `salt` (string): The salt to initialize the database.
  - `checksum` (string): The checksum for database initialization.
- **Response**:
  - Returns the initialized `salt` and `checksum`.

---

#### User Login
- **Method**: `POST`
- **Endpoint**: `/api/auth/login`
- **Request Body**:
  - `checksum` (string): The checksum provided by the user.
- **Response**:
  - Returns the provided `checksum` on successful login.

---

#### Get Salt
- **Method**: `GET`
- **Endpoint**: `/api/auth/salt`
- **Response**:
  - Returns the `salt` from the database or `null` if not found.

---

### Company Routes

#### Get Company by ID
- **Method**: `GET`
- **Endpoint**: `/api/companies`
- **Query Parameters**:
  - `id` (number): The ID of the company to retrieve.
- **Cookies**:
  - `sessionid` (string): Session identifier.
- **Response**:
  - **Status Codes**:
    - `200 OK`: Successfully retrieved the company.
    - `404 NOT FOUND`: Company not found.
    - `400 BAD REQUEST`: Invalid request.
    - `500 INTERNAL SERVER ERROR`: Server error.
  - Returns company information: 
    - `id` (number)
    - `fake_name` (string)
    - `real_name` (string)
    - `info` (string)

---

#### Create a New Company
- **Method**: `POST`
- **Endpoint**: `/api/companies`
- **Request Body**:
  - `fake_name` (string): The fake name of the company.
  - `real_name` (string): The real name of the company.
  - `info` (string, optional): Additional information about the company.
- **Cookies**:
  - `sessionid` (string): Session identifier.
- **Response**:
  - **Status Codes**:
    - `201 CREATED`: Company created successfully.
    - `400 BAD REQUEST`: Invalid request.
    - `409 CONFLICT`: Conflict in company creation.
    - `500 INTERNAL SERVER ERROR`: Server error.
  - Returns created company information.

---

#### Remove Company by ID
- **Method**: `DELETE`
- **Endpoint**: `/api/companies`
- **Query Parameters**:
  - `id` (number): The ID of the company to remove.
- **Cookies**:
  - `sessionid` (string): Session identifier.
- **Response**:
  - **Status Codes**:
    - `204 NO CONTENT`: Company deleted successfully.
    - `404 NOT FOUND`: Company not found.
    - `400 BAD REQUEST`: Invalid request.
    - `500 INTERNAL SERVER ERROR`: Server error.

---

#### Update Company by ID
- **Method**: `PUT`
- **Endpoint**: `/api/companies`
- **Query Parameters**:
  - `id` (number): The ID of the company to update.
- **Request Body**:
  - `fake_name` (string): Updated fake name of the company.
  - `real_name` (string): Updated real name of the company.
  - `info` (string, optional): Updated additional information about the company.
- **Cookies**:
  - `sessionid` (string): Session identifier.
- **Response**:
  - **Status Codes**:
    - `200 OK`: Company updated successfully.
    - `404 NOT FOUND`: Company not found.
    - `400 BAD REQUEST`: Invalid request.
    - `409 CONFLICT`: Conflict in company update.
    - `500 INTERNAL SERVER ERROR`: Server error.
  - Returns updated company information.

---

#### Get All Companies
- **Method**: `GET`
- **Endpoint**: `/api/companies/bulk`
- **Cookies**:
  - `sessionid` (string): Session identifier.
- **Response**:
  - **Status Codes**:
    - `200 OK`: Successfully retrieved all companies.
    - `500 INTERNAL SERVER ERROR`: Server error.
  - Returns an array of company information.

---

#### Insert Multiple Companies
- **Method**: `POST`
- **Endpoint**: `/api/companies/bulk`
- **Request Body**:
  - An array of companies with `fake_name` and `real_name`.
- **Cookies**:
  - `sessionid` (string): Session identifier.
- **Response**:
  - **Status Codes**:
    - `201 CREATED`: Companies created successfully.
    - `400 BAD REQUEST`: Invalid request.
    - `409 CONFLICT`: Conflict in company creation.
    - `500 INTERNAL SERVER ERROR`: Server error.
  - Returns an array of created company information.

---

#### Update Multiple Companies
- **Method**: `PUT`
- **Endpoint**: `/api/companies/bulk`
- **Request Body**:
  - An array of companies with `id`, `fake_name`, and `real_name`.
- **Cookies**:
  - `sessionid` (string): Session identifier.
- **Response**:
  - **Status Codes**:
    - `200 OK`: Companies updated successfully.
    - `404 NOT FOUND`: Company not found.
    - `400 BAD REQUEST`: Invalid request.
    - `409 CONFLICT`: Conflict in company update.
    - `500 INTERNAL SERVER ERROR`: Server error.
  - Returns an array of updated company information.

---

#### Remove Multiple Companies
- **Method**: `DELETE`
- **Endpoint**: `/api/companies/bulk`
- **Request Body**:
  - An array of company IDs to remove.
- **Cookies**:
  - `sessionid` (string): Session identifier.
- **Response**:
  - **Status Codes**:
    - `204 NO CONTENT`: Companies deleted successfully.
    - `404 NOT FOUND`: Companies not found.
    - `400 BAD REQUEST`: Invalid request.
    - `500 INTERNAL SERVER ERROR`: Server error.

---

#### Rotate Database
- **Method**: `POST`
- **Endpoint**: `/api/companies/rotate`
- **Request Body**:
  - An array of companies with `id`, `fake_name`, and `real_name` to update.
- **Query Parameters**:
  - `backup` (boolean, optional): Indicates if a backup should be created.
- **Headers**:
  - `x-salt` (string): New salt for the database.
  - `x-checksum` (string): New checksum for the database.
- **Cookies**:
  - `sessionid` (string): Session identifier.
- **Response**:
  - **Status Codes**:
    - `200 OK`: Database rotated successfully.
    - `404 NOT FOUND`: Company not found.
    - `400 BAD REQUEST`: Invalid request.
    - `409 CONFLICT`: Conflict in database rotation.
    - `500 INTERNAL SERVER ERROR`: Server error.
  - Returns an array of updated company information.

---