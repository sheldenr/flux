import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

// Ensure variables are present
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const resendApiKey = process.env.RESEND_API_KEY
const fallbackEmail = process.env.NOTIFICATION_EMAIL

if (!supabaseUrl || !supabaseServiceKey || !resendApiKey) {
  console.error("Missing required environment variables (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY).")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const resend = new Resend(resendApiKey)


async function run() {
  const todayStr = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  
  // 1. Fetch notification email setting
  const { data: settingData, error: settingError } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'notification_email')
    .maybeSingle()
  
  if (settingError) throw settingError
  const targetEmail = settingData?.value || fallbackEmail

  if (!targetEmail) {
    console.error("No notification email configured. Please enter one in your application settings or configure NOTIFICATION_EMAIL env var.")
    process.exit(1)
  }

  // 2. Fetch contacts
  const { data: contacts, error } = await supabase
    .from('contacts')
    .select('name, role, company, next')
  
  if (error) throw error

  // Filter contacts due today or in the past
  const dueContacts = (contacts || []).filter(contact => {
    if (!contact.next) return false
    const nextClean = contact.next.trim()
    if (nextClean === 'Today') return true
    if (/^\d{4}-\d{2}-\d{2}$/.test(nextClean)) {
      return nextClean <= todayStr
    }
    return false
  })

  if (dueContacts.length === 0) {
    console.log("No contacts due today!")
    return
  }

  // 3. Format the email content
  const contactListHtml = dueContacts.map(c => 
    `<li><strong>${c.name}</strong> - ${c.role || 'No Role'} at ${c.company || 'No Company'} (Due: ${c.next})</li>`
  ).join('')

  const emailHtml = `
    <h2>Flux Daily Contact Reminders</h2>
    <p>Here are the people you should reach out to today:</p>
    <ul>${contactListHtml}</ul>
    <p>Have a great day!</p>
  `

  // 4. Send email via Resend
  await resend.emails.send({
    from: 'Flux Reminders <onboarding@resend.dev>',
    to: targetEmail,
    subject: `Flux Reminders: ${dueContacts.length} people to contact today`,
    html: emailHtml,
  })

  console.log(`Sent reminder email to ${targetEmail} containing ${dueContacts.length} contacts!`)
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
