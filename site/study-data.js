/* Interview-prep flashcard content. Static data — edit here, no build step needed.
   Sourced from the IT-Basics-Interview, CAR-IT-Technical, and Behavioral (the-bank-v2)
   tabs of the interview question bank, plus the Interview Story Bank for real stories.
   Behavioral answers are deliberately condensed/paraphrased from the Story Bank and
   honor its accuracy guardrails (see notes on Stories 3, 4, 5, 6 below) — never
   overclaim beyond what actually happened. */
(function () {
  // ---------- the 9 real CAR stories (condensed) ----------
  window.STUDY_STORIES = {
    s1: {
      title: "Taking ownership of P2 healthcare incidents (Orlando Health)",
      cause: "Overnight Priority 2 incidents on critical-care/patient-monitoring equipment needed fast, reliable handling.",
      action: "Learned the troubleshooting procedures and equipment workflow, proved I could work independently, and within ~2 months was approved to handle P2s solo — about 5/day, escalating to Field Support when staff couldn't get a low-battery device onto AC power.",
      result: "Cut my own handling time from ~20 min to ~5 min (~75%, based on my own observation, not a formal ServiceNow measurement) and helped keep equipment available.",
      skills: ["initiative", "independent troubleshooting", "escalation judgment", "healthcare IT"],
    },
    s2: {
      title: "Multi-state Epic go-lives & AD access (Orlando Health)",
      cause: "Hospitals in Alabama and new Orlando facilities were moving from legacy Epic to Orlando Health's Hyperspace; users often confused Epic Care Link with Hyperspace, and some contractor devices weren't MDM-enrolled, limiting remote support.",
      action: "Asked open-ended questions to find the real need, checked KB docs, verified AD security-group membership, and added users to the correct AD security groups when access was missing; coordinated warm handoffs to other teams for anything patient-care-affecting.",
      result: "Helped employees get through the access transition during go-live and sharpened my AD / Epic / cross-team skills.",
      skills: ["Active Directory", "Epic support", "requirements clarification", "cross-team coordination"],
    },
    s3: {
      title: "Building the UPC Command Center (AdventHealth)",
      cause: "As UPC Secretary, there was no centralized way to track attendance, Action Request Forms, minutes, and approval status.",
      action: "Reviewed existing SharePoint documentation, then used Excel + Microsoft Copilot to build a tracker. Tried to automate attendance-percentage with formulas, found they made the file unreliable, and removed them in favor of reliability and mobile usability.",
      result: "Gave myself a centralized way to manage council info, prep for meetings, and track ARFs; some members used it to reference past records. (Not claiming all members/leadership used it routinely.)",
      skills: ["Excel + Copilot", "process design", "testing/validation", "stakeholder documentation"],
    },
    s4: {
      title: "EVS workflow reporting form (AdventHealth)",
      cause: "EVS staff sometimes reached a discharge room to find patient belongings or discharge steps still unfinished, slowing room turnover.",
      action: "Used Copilot + Microsoft tools to design a mobile-friendly reporting form aimed at under a one-minute submission, and presented it to the EVS director, who approved it for its simplicity and speed.",
      result: "Delivered an approved design meant to surface these gaps for leadership. (Not confirmed deployed — no claim of a measured turnover-time improvement.)",
      skills: ["user-centered design", "workflow analysis", "stakeholder presentation"],
    },
    s5: {
      title: "Windows 10→11 endpoint imaging fix (MSP contract)",
      cause: "A workstation repeatedly failed to image during an endpoint refresh despite following the documented procedure; the desktop lead suggested returning another day.",
      action: "Isolated variables onsite — disconnected the keyboard/mouse, tried different Ethernet ports, noticed an amber indicator light on the attached printer, disconnected it and retried, then ran the printer's documented reset procedure.",
      result: "Imaged the workstation and restored the printer onsite, and shared the discovery with the lead. (Not claiming the printer was definitively the root cause — just what resolved it that day.)",
      skills: ["endpoint deployment", "hardware troubleshooting", "systematic isolation", "knowledge sharing"],
    },
    s6: {
      title: "VIP physician Imprivata/VDI authentication (healthcare go-live)",
      cause: "A physician authenticated fine via Imprivata badge-tap but wasn't auto-signed into Epic and other apps since onboarding, forcing manual logins during a demanding schedule.",
      action: "Checked her AD group membership and the Imprivata admin console, looped in my lead via Teams for another angle, and found she had VDI Profile C assigned when her AD group expected Profile A; corrected the profile and had her retest on a different machine.",
      result: "She verbally confirmed afterward that automatic authentication was working. (She confirmed it — I didn't personally observe the login.)",
      skills: ["Active Directory", "Imprivata/VDI", "escalation & collaboration", "root-cause investigation"],
    },
    s7: {
      title: "Solo Saturday repair rush (consumer electronics repair)",
      cause: "Working alone during an unexpected rush of walk-ins while running a 1-hour-SLA iPhone screen insurance repair.",
      action: "Set honest expectations with the original guest about the 1-hour timeline, then juggled check-ins, inventory, and questions from arriving customers while chipping away at the repair whenever I could get back to it.",
      result: "Finished the repair inside the promised 1-hour SLA while keeping the other guests served; several customers complimented how it was handled.",
      skills: ["prioritization under pressure", "customer communication", "independent execution"],
    },
    s8: {
      title: "Taking accountability for an iPhone repair incident",
      cause: "During a battery replacement that had passed pre-repair screen inspection, a hairline crack appeared near the top of the display while opening the device per the documented procedure.",
      action: "Took ownership of the conversation with the guest, explained what happened, and offered a bundled repair price or an upgrade; the guest chose the upgrade, and the shop applied full trade-in value (absorbing the difference) rather than penalizing them for the new damage.",
      result: "The guest got a fair resolution, and I became more deliberate about inspecting screens before future front-opening repairs.",
      skills: ["accountability", "transparent communication", "problem resolution"],
    },
    s9: {
      title: "Catching an outdated knowledge-base article (healthcare IT)",
      cause: "Followed the KB's documented escalation path on a connectivity ticket; it was reassigned back to me the next day, conflicting with what the KB said.",
      action: "Instead of just rerouting it again, contacted the technician who'd received it and looped in my supervisor since the reassignment contradicted the KB.",
      result: "Found the escalation process had changed but the KB article hadn't been updated; flagged it, and my supervisor corrected the article that same day and credited the catch.",
      skills: ["documentation hygiene", "cross-team follow-through", "initiative"],
    },
  };

  // ---------- Deck 1: IT Basics (35 cards) ----------
  const itBasics = [
    ["Networking", "What is ping?", "Sends ICMP echo requests to a host and reports whether it replies and how long the round trip takes.", "Checking whether a host is reachable and measuring latency.", "ping 8.8.8.8 returns replies in ms; repeated timeouts point to a block or outage."],
    ["Networking", "What is DNS?", "The system that translates names like portal.example.com into IP addresses.", "When users reach sites by IP but not by name, DNS is the first suspect.", "nslookup portal.example.com returns the IP the record points to."],
    ["Networking", "What is DHCP?", "A service that automatically assigns IP address, subnet mask, gateway, and DNS settings to devices.", "Lets devices join a network without manual configuration.", "A laptop receives 10.0.5.23 on connect; ipconfig /all shows the lease."],
    ["Networking", "What's the difference between TCP and UDP?", "TCP is connection-oriented and guarantees delivery. UDP is connectionless, faster, and does not guarantee delivery.", "TCP for web and email; UDP for DNS queries, VoIP, and streaming.", "HTTPS uses TCP 443; DNS queries usually use UDP 53."],
    ["Networking", "What is an IP address and a subnet mask?", "An IP address identifies a device on a network. The subnet mask splits the address into network and host portions.", "Planning address ranges and checking whether two devices share a subnet.", "192.168.1.10 with 255.255.255.0 sits on the 192.168.1.0/24 network."],
    ["Networking", "What is a VLAN?", "A logical split of one physical switch into separate broadcast domains.", "Keeping traffic separated, such as guest Wi-Fi from staff devices.", "Switch port 12 is assigned to VLAN 20 for printers."],
    ["Networking", "What is a default gateway?", "The router address a device uses to reach networks outside its own subnet.", "If it is wrong or missing, local traffic works but internet access fails.", "A PC uses 192.168.1.1 as its gateway."],
    ["Networking", "Walk me through troubleshooting a user who says they have no internet.", "Work up the layers: physical link, IP configuration, gateway, external IP, DNS, then the application.", "Narrowing the failure to one layer quickly.", "ipconfig, then ping the gateway, then ping 8.8.8.8, then nslookup google.com."],
    ["Networking", "What is traceroute (tracert on Windows)?", "Shows each hop a packet takes to a destination, along with latency at each hop.", "Finding where traffic stops or slows.", "tracert 8.8.8.8 times out at hop 4, pointing to that router or its upstream link."],
    ["Identity", "What is Active Directory?", "Microsoft's directory service for centrally managing users, computers, and resources on a Windows network.", "Authentication, group membership, and policy in on-premises environments.", "A user signs into a domain PC with their AD account."],
    ["Identity", "What is Group Policy?", "Settings that AD pushes to users and computers.", "Enforcing security baselines, mapping drives, and deploying software.", "A GPO forces a screen lock after 10 minutes of inactivity."],
    ["Identity", "What is Entra?", "Microsoft's cloud identity and access service. It was formerly called Azure AD (Entra ID).", "Cloud sign-in, single sign-on to Microsoft 365 and SaaS apps, MFA, and conditional access.", "A user signs in to Microsoft 365 with an Entra account."],
    ["Identity", "What's the difference between Active Directory and Entra ID?", "AD DS runs on-premises and uses Kerberos, LDAP, and Group Policy. Entra ID runs in the cloud and uses OAuth, SAML, and OIDC. Entra Connect syncs the two in hybrid setups.", "Managing hybrid identity and cloud access.", "An on-prem user syncs to Entra so they can use Microsoft 365."],
    ["Identity", "What is MFA, and why use it?", "Multi-factor authentication requires two or more proofs: something you know, have, or are.", "Limiting the damage from stolen passwords.", "A password followed by an approval in an authenticator app."],
    ["Identity", "What is SSO?", "Single sign-on lets a user sign in once and access many applications.", "Reducing password fatigue and centralizing access control.", "Signing into Salesforce through Entra SSO."],
    ["Identity", "How do you handle a locked-out account?", "Verify the user's identity under policy, find the lockout source, unlock the account, and advise on a password reset. Repeated lockouts can mean a stale device or a password attack.", "Fast, secure resolution that also catches underlying problems.", "A phone still holding an old saved password keeps locking the account."],
    ["Security", "What is the CIA triad?", "Confidentiality limits access to authorized people. Integrity keeps data accurate and unaltered. Availability keeps systems accessible when needed.", "A framework for judging and designing security controls.", "Encryption supports confidentiality, hashing supports integrity, and redundancy supports availability."],
    ["Security", "What is least privilege?", "Users get only the access their job requires.", "Limiting the damage a compromised account can do.", "A help desk account can reset passwords but cannot manage domain admin groups."],
    ["Security", "What do you do when a user reports a phishing email?", "Confirm the email, check who clicked or entered credentials, isolate affected accounts, purge the message, and block the sender or URL.", "Stopping a phish from spreading.", "A reported invoice email is pulled from all mailboxes and the sending domain is blocked."],
    ["Security", "What's the difference between a virus, malware, and ransomware?", "Malware is the umbrella term for malicious software. A virus attaches to files and spreads. Ransomware encrypts data and demands payment.", "Choosing the right response to each type.", "A ransomware alert triggers host isolation and backup verification."],
    ["Security", "What is EDR?", "Endpoint detection and response monitors devices for suspicious behavior and can isolate them.", "Detecting and containing threats on endpoints.", "An EDR tool isolates a laptop after it runs a suspicious script."],
    ["Security", "What is a SIEM?", "A security information and event management platform collects and correlates logs from many sources to flag threats.", "Central alerting and investigation.", "A SIEM rule raises an alert after 20 failed logins in 5 minutes."],
    ["Security", "What is MITRE ATT&CK?", "A public knowledge base of adversary tactics and techniques.", "Mapping detections to known attacker behavior and finding coverage gaps.", "T1110 covers brute-force attempts."],
    ["Security", "What is a firewall?", "Filters traffic by source, destination, port, and protocol according to rules.", "Controlling which traffic can enter or leave a network.", "A rule blocks inbound RDP from the internet."],
    ["Security", "What's the difference between encryption at rest and in transit?", "Encryption at rest protects stored data. Encryption in transit protects data moving across a network, such as with TLS.", "Protecting data in every state.", "BitLocker protects a laptop's disk, and HTTPS protects web traffic."],
    ["Systems", "How do Linux file permissions work?", "Permissions apply to the owner, group, and others, and cover read, write, and execute. chmod changes them.", "Controlling who can access files.", "chmod 640 gives the owner read/write and the group read-only access."],
    ["Systems", "What does sudo do?", "Runs a single command with elevated privileges, usually as root, and logs the action.", "Admin tasks without logging in as root.", "sudo systemctl restart nginx."],
    ["Systems", "How do you check whether a service is running on Linux?", "Use systemctl status for the service and journalctl for its logs.", "Troubleshooting services that fail or stop.", "systemctl status sshd shows whether SSH is active."],
    ["Systems", "What is Event Viewer used for?", "It shows Windows system, security, and application logs.", "Troubleshooting failures and auditing activity.", "Event ID 4625 indicates a failed logon."],
    ["Systems", "What's the difference between a backup, a snapshot, and disaster recovery?", "A backup is a separate copy of data. A snapshot is a point-in-time state. Disaster recovery is the plan and infrastructure for restoring operations.", "Recovery planning.", "Nightly offsite backups with a tested restore."],
    ["Cloud", "What's the difference between IaaS, PaaS, and SaaS?", "They are infrastructure, platform, and software as a service. The provider manages more of the stack as you move from IaaS to SaaS.", "Deciding what you manage versus what the provider manages.", "An Azure VM is IaaS, Azure App Service is PaaS, and Microsoft 365 is SaaS."],
    ["Endpoint", "What is Intune?", "Microsoft's cloud device management service for enrolling, configuring, and securing devices and apps.", "Pushing policies and apps, and wiping lost devices.", "A compliance policy requires BitLocker before a laptop can access email."],
    ["Service Management", "What's the difference between an incident and a problem?", "An incident is an unplanned interruption. A problem is the underlying cause behind one or more incidents.", "Linking repeated tickets to a root cause.", "Repeated printer crashes lead to a problem ticket for a driver update."],
    ["Service Management", "How do you prioritize tickets?", "Weigh impact and urgency, the SLA, and how critical the affected system or user is.", "Handling a queue fairly and meeting SLAs.", "A failed executive laptop outranks a single printer issue."],
    ["Service Management", "How do you explain a technical issue to a non-technical user?", "Use plain language, avoid jargon, use an analogy if it helps, and confirm the user understood.", "Keeping users informed and reducing repeat tickets.", "Explaining DNS as the phone book for the network."],
  ].map((r, i) => ({ id: "itb" + (i + 1), tag: r[0], q: r[1], back: [r[2], "When: " + r[3], "Example: " + r[4]] }));

  // ---------- Deck 2: Technical CAR warm-ups (9 cards) ----------
  const technical = [
    ["Write a Bash script that merges two server inventory files (one hostname per line) and removes duplicate hostnames, keeping the first occurrence.",
      "Cause (at my last opportunity): [the situation where server lists were out of sync]. Action: [the script you wrote, how you tested it, and how you ran it safely]. Result: [the outcome, such as hours saved or errors removed; use your real numbers]."],
    ["Write a Bash or PowerShell loop that pings 192.168.1.1 through 192.168.1.100 and reports which hosts respond. (Concept: what ping tests and when to use it.)",
      "Cause: [the network check you needed]. Action: [the script, how you handled timeouts, and how you verified results]. Result: [the outcome you achieved]."],
    ["Write a script that takes a hostname such as web01.dc2.corp.example.com and prints its domain labels in reverse order.",
      "Cause: [the naming or DNS task]. Action: [how you parsed and tested the input]. Result: [the outcome]."],
    ["Write a script that reads a web server access log and returns the top three requested URLs by hit count.",
      "Cause: [the log review or troubleshooting need]. Action: [the commands or script you used, such as awk, sort, uniq]. Result: [what the findings led to]."],
    ["Write a Python or jq script that flattens a JSON device inventory from an API into one row per network interface, with hostname, interface name, and IP address.",
      "Cause: [the inventory or reporting need]. Action: [how you parsed the nested data and validated it]. Result: [the outcome]."],
    ["Write a PowerShell or Python script that removes duplicate user entries from an Active Directory CSV export, keyed on samAccountName.",
      "Cause: [the account cleanup or audit task]. Action: [how you identified duplicates and protected against deleting the wrong record]. Result: [the outcome]."],
    ["Write a function that throttles calls to a REST API so no more than N requests go out per second, and retries on HTTP 429 with a backoff.",
      "Cause: [the API rate-limit problem you ran into]. Action: [the throttle or retry logic and how you tested it]. Result: [the outcome]."],
    ["Write a script that groups a list of servers by OS and by site, then prints the count in each group.",
      "Cause: [the asset or patch-planning need]. Action: [how you grouped and formatted the output]. Result: [how the report was used]."],
    ["Write a wrapper script that logs every command it runs, with timestamp, user, and exit code, to a file or syslog.",
      "Cause: [the auditing or troubleshooting gap]. Action: [how you built the wrapper and tested the logging]. Result: [the outcome]."],
  ].map((r, i) => ({ id: "tech" + (i + 1), tag: "CAR template", q: r[0], back: [r[1], "Tip: fill the brackets with a real script and real numbers before using this in an interview — don't recite the bracket text."] }));

  // ---------- Deck 3: Behavioral (28 cards) ----------
  // storyId -> primary story from STUDY_STORIES; alt -> alternate story/approach; note -> caution from the cross-reference table
  const beh = [
    { q: "Tell me about yourself.", alt: "Blend Stories 1, 2, 3, 5, and 6 into one career narrative; don't retell all five in full.", note: null, storyId: null },
    { q: "Walk me through your most recent project. What did you build, what was your part, and what would you do differently?", storyId: "s3", alt: "Story 4 — EVS reporting form." },
    { q: "Why did you move into software/systems engineering?", alt: "Draw career motivation from Stories 1, 5, and 6 — the troubleshooting and systems-thinking thread.", storyId: null },
    { q: "What do you know about our company?", alt: "No story — this is company research. Prep fresh for each employer.", storyId: null },
    { q: "Why do you want to work here, and why this role specifically?", alt: "Combine the career narrative with Stories 1, 2, 5, and 6 and the specific job requirements.", storyId: null },
    { q: "Tell me about a time you had to learn a new technology or an unfamiliar codebase quickly. How did you approach it?", storyId: "s6", alt: "Story 5 — endpoint imaging." },
    { q: "Give me an example of a project or initiative you started on your own. What prompted it?", storyId: "s3", alt: "Story 4 — EVS reporting form." },
    { q: "Tell me about a time you were juggling several projects or deadlines at once. How did you prioritize?", storyId: "s7", alt: "Story 6 — healthcare go-live." },
    { q: "Describe a situation where you didn't communicate well enough. What happened, and what did you change?", storyId: null, note: "Not yet established — needs a genuine example. Don't invent one; journal a real moment." },
    { q: "Tell me about a conflict on your team. How was it resolved, and what would you do differently now?", storyId: "s9", note: "Careful: this was a process disagreement, not necessarily interpersonal conflict — frame it honestly." },
    { q: "Tell me about a time you were given an ambiguous or under-specified task. What did you do first?", storyId: "s4", alt: "Story 3 — UPC Command Center." },
    { q: "Describe a project you worked hard on that still didn't get the result you wanted. Why, and what did you learn?", storyId: "s3", alt: "Story 4 — EVS form, if discussing the lack of confirmed deployment." },
    { q: "Tell me about a time you had trouble getting others to accept your idea. How did you approach it? Did it work?", storyId: "s4", alt: "Story 3 — UPC Command Center." },
    { q: "Tell me about a time you were responsible for planning a piece of work. Did it go to plan? What did you adjust?", storyId: "s3", alt: "Story 4 — EVS reporting form." },
    { q: "Tell me about a mistake you made at work. How did you handle it, and what did you change?", storyId: "s8" },
    { q: "Tell me about a time you worked with someone who wasn't pulling their weight. Did you talk to them? To your manager?", storyId: null, note: "Not yet established — needs a genuine example." },
    { q: "Describe a time you worked well under pressure. What was going on, and how did you get through it?", storyId: "s7", alt: "Story 6 — VIP physician." },
    { q: "Tell me about a time you failed.", storyId: "s8", note: "Focus on accountability and what you learned, not just what went wrong." },
    { q: "Tell me about a time you disagreed with a decision but committed to it anyway.", storyId: null, note: "Not yet established — Story 9 doesn't fully answer this. Needs a genuine example." },
    { q: "Tell me about a time you had to deliver bad news — a slipped deadline, a bug in production — to a stakeholder.", storyId: "s8" },
    { q: "Tell me about a time you had to push back on scope or say no. How did you do it?", storyId: null, note: "Not yet established — needs a genuine example." },
    { q: "How do you decide when to ask for help versus keep digging on your own?", storyId: "s6", alt: "Story 5 — endpoint imaging." },
    { q: "Tell me about a time you used an AI tool to move faster. How did you check its output?", storyId: "s3", alt: "Story 4 — EVS reporting form (Copilot use)." },
    { q: "Describe how you've worked with people in other time zones or mostly asynchronously. What worked, and what didn't?", storyId: "s2", note: "More real detail needed — flesh this out before relying on it." },
    { q: "What's some critical feedback you've gotten recently, and what did you do with it?", storyId: null, note: "Not yet established — needs a genuine example." },
    { q: "How do you stay current? What do you read, watch, or build?", alt: "Lean on Security+/A+ certs plus the homelab and Linux learning path as your current routine.", storyId: null },
    { q: "Where do you want your career to be in five years? What does your ideal role look like?", alt: "Systems Engineer → Infrastructure Engineer → Network/Security Engineer.", storyId: null },
    { q: "Do you have any questions for me?", alt: "Keep a short prepared question bank and tailor 2–3 to each employer.", storyId: null },
  ].map((r, i) => ({ id: "beh" + (i + 1), tag: "Behavioral", q: r.q, type: "behavioral", storyId: r.storyId, alt: r.alt, note: r.note }));

  window.STUDY_DECKS = [
    { id: "itbasics", name: "IT Basics", icon: "🧩", cards: itBasics },
    { id: "technical", name: "Technical (CAR)", icon: "🛠️", cards: technical },
    { id: "behavioral", name: "Behavioral", icon: "🗣️", cards: beh },
  ];
})();
