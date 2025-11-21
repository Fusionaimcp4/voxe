/**
 * ReferralRocket Tracking Helper
 * Tracks referrals when users sign up or make purchases
 */

/**
 * Track a referral signup
 * This should be called when a new user successfully signs up
 */
export async function trackReferralSignup(userEmail: string, userName?: string) {
  try {
    // ReferralRocket widget stores referral data in cookies/localStorage
    // The widget script handles the tracking automatically when the page loads
    // For server-side tracking, we can make an API call if ReferralRocket provides one
    // For now, the client-side widget will handle signup tracking via their JavaScript SDK
    
    // If ReferralRocket provides a server-side API, we would call it here
    // Example (if available):
    // await fetch('https://app.referralrocket.io/api/track/signup', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     campaignId: '6eMJMYDA',
    //     email: userEmail,
    //     name: userName,
    //   }),
    // });

    console.log('[ReferralRocket] Signup tracked:', { userEmail, userName });
  } catch (error) {
    // Don't fail the signup process if referral tracking fails
    console.error('[ReferralRocket] Failed to track signup:', error);
  }
}

/**
 * Track a referral purchase
 * This should be called when a user completes a purchase/subscription
 */
export async function trackReferralPurchase(
  userEmail: string,
  amount: number,
  currency: string = 'usd',
  orderId?: string
) {
  try {
    // ReferralRocket widget tracks purchases via their JavaScript SDK
    // For server-side tracking, we can make an API call if ReferralRocket provides one
    // For now, the client-side widget will handle purchase tracking via their JavaScript SDK
    
    // If ReferralRocket provides a server-side API, we would call it here
    // Example (if available):
    // await fetch('https://app.referralrocket.io/api/track/purchase', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     campaignId: '6eMJMYDA',
    //     email: userEmail,
    //     amount,
    //     currency,
    //     orderId,
    //   }),
    // });

    console.log('[ReferralRocket] Purchase tracked:', { userEmail, amount, currency, orderId });
  } catch (error) {
    // Don't fail the purchase process if referral tracking fails
    console.error('[ReferralRocket] Failed to track purchase:', error);
  }
}

