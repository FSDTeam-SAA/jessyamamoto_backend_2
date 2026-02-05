const createUserSuccessfully = (
    name?: string,
    email?: string,
    companyName: string = "Your Company"
  ): string => `
    <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: auto; background-color: #f3f4f6; padding: 30px;">
      <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <header style="background: linear-gradient(90deg, #16a34a, #22c55e); padding: 24px; text-align: center; color: #ffffff;">
          <h2 style="margin: 0; font-size: 24px;">🎉 Welcome to ${companyName}!</h2>
          <p style="margin: 6px 0 0; font-size: 14px;">Your account has been created successfully</p>
        </header>
  
        <!-- Main Content -->
        <main style="padding: 30px 25px;">
          <p style="font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 18px;">
            Hi ${name || email || "there"},
          </p>
  
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            We’re excited to have you on board 🎊. Your account with 
            <strong>${companyName}</strong> has been successfully created.
          </p>
  
          <div style="margin: 30px 0; text-align: center;">
            <a href="#" style="display: inline-block; background-color: #16a34a; color: #ffffff; font-size: 16px; font-weight: bold; padding: 14px 28px; border-radius: 10px; text-decoration: none; transition: background 0.3s;">
              Go to Dashboard
            </a>
          </div>
  
          <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
            If you have any questions, just reply to this email—we’re always happy to help out.
          </p>
        </main>
  
        <!-- Footer -->
        <footer style="background-color: #f9fafb; text-align: center; padding: 16px; font-size: 12px; color: #9ca3af;">
          &copy; ${new Date().getFullYear()} ${companyName}. All rights reserved.
        </footer>
  
      </div>
    </div>
  `;
  
  export default createUserSuccessfully;
  