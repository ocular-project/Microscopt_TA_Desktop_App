export default function LawyerTerms(){

     const appName = "iLawyer";
    const companyName = "Diamond Advocates";
    const lastUpdated = "August 14, 2025";

    return (
        <div className="terms-container">
      <h1>Terms and Conditions</h1>
      <p className="last-updated">Last Updated: {lastUpdated}</p>

      <p>
        Welcome to <strong>{appName}</strong>. By using our app, you agree to comply with and be bound by these terms.
        Please read them carefully.
      </p>

      <h2>1. Purpose</h2>
      <p>
        This app connects clients with lawyers in Uganda based on practice areas, location, and availability.
      </p>

      <h2>2. Registration</h2>
      <p>
        Lawyers and clients must register accurate details including name, contact, and location. Lawyers must specify
        their practice areas, working days, and hours.
      </p>

      <h2>3. Data Collected</h2>
      <p>
        We collect and store the following information to provide and improve our services:
      </p>
      <ul>
        <li><strong>From Lawyers:</strong> Name, contact details, location, practice areas, working hours, and working days.</li>
        <li><strong>From Clients:</strong> Name, contact details, and location.</li>
        <li>
          <strong>Automatically Collected Data:</strong> Device information, app usage data, and communication records
          between users where applicable.
        </li>
      </ul>
      <p>
        This information is used solely for matching clients with lawyers, facilitating communication, and improving
        the app experience. We do not sell your personal data to third parties.
      </p>

      <h2>4. Services</h2>
      <p>
        {appName} only facilitates contact between clients and lawyers. We do not provide legal services and are not
        responsible for advice given.
      </p>

      <h2>5. Client–Lawyer Communication</h2>
      <p>
        Clients can directly call lawyers using contact details provided in the app. All legal advice is given outside
        the app and at the discretion of the lawyer.
      </p>

      <h2>6. User Responsibilities</h2>
      <p>
        Users agree to provide truthful information, respect other users, and comply with applicable Ugandan laws when
        using this app.
      </p>

      <h2>7. Privacy</h2>
      <p>
        Your data will be handled according to our Privacy Policy. By using the app, you consent to our data practices.
      </p>

      <h2>8. Limitation of Liability</h2>
      <p>
        We are not liable for any legal advice given, disputes between users, or outcomes of client–lawyer interactions.
      </p>

      <h2>9. Governing Law</h2>
      <p>
        These terms are governed by the laws of Uganda. Any disputes will be handled in Ugandan courts.
      </p>

      <h2>10. Contact</h2>
      <p>
        For any questions regarding these Terms, please contact us at <strong>support@yourcompany.com</strong>.
      </p>

      <p className="footer-note">
        © {new Date().getFullYear()} {companyName}. All rights reserved.
      </p>
    </div>
    )
}