export const PROJECTS = [
  {
    id: "arches-notifications",
    title: "Arches Notifications",
    sheetTab: "Arches Notifications",
    description: "User acceptance tests for the notify-on-tile-save function.",
    prerequisites: [
      "At least two test users exist (e.g. User A and User B — use any accounts available to you).",
      "Both users belong to the Resource Editor group.",
      "Both users have valid email addresses set on their account.",
      "One resource graph (e.g. \"Monument\") has the \"Notify on tile save\" function attached, with one rule configured: Nodegroup: any (e.g. Description), Groups to notify: Resource Editor, Message: Resource {name} was updated, Send email: ticked, Email template: General notification, Button text and link path: left at defaults."
    ],
    tests: [
      {
        id: "n01",
        title: "Web notification fires on tile save",
        preconditions: "You are signed in as User A. A Monument resource exists.",
        steps: [
          "Sign in as User A (the user who will make the edit).",
          "Create a new Monument resource or open an existing one.",
          "Edit and save the Description tile.",
          "Sign out, then sign in as User B (a different user in Resource Editor).",
          "Click the bell icon in the top-right of the screen."
        ],
        expected: "User B sees one notification with the message \"Resource [name] was updated\". The notification shows the time it was sent."
      },
      {
        id: "n02",
        title: "Tile saver is NOT notified",
        preconditions: "You are signed in as User A.",
        steps: [
          "Sign in as User A.",
          "Save a Monument tile.",
          "Click the bell icon."
        ],
        expected: "User A sees no new notification for the tile they just saved."
      },
      {
        id: "n03",
        title: "Email is sent for ticked rules",
        preconditions: "User A is signed in.",
        steps: [
          "Sign in as User A and save a Monument tile.",
          "Check User B's email inbox."
        ],
        expected: "User B receives an email with the same message text in the body. The email subject matches the rule's notification name. The email has a button labelled \"View resource\"."
      },
      {
        id: "n04",
        title: "Email 'View resource' button opens the right resource",
        preconditions: "User B has received the email from Test 3.",
        steps: [
          "Open the email from Test 3.",
          "Click View resource."
        ],
        expected: "A browser tab opens on the resource report page for the exact Monument that was saved."
      },
      {
        id: "n05",
        title: "Bell 'Open resource' button works",
        preconditions: "User B is signed in and has the bell notification from Test 1.",
        steps: [
          "As User B, open the bell-dropdown notification from Test 1.",
          "Click Open resource."
        ],
        expected: "A new tab opens on the resource report page for the saved Monument."
      },
      {
        id: "n06",
        title: "Notifications appear in email preferences",
        preconditions: "Signed in as User B.",
        steps: [
          "As User B, go to Profile → Notification preferences."
        ],
        expected: "The rule's notification type appears as its own entry. User B can toggle web and email independently."
      },
      {
        id: "n07",
        title: "Opting out of email keeps web notification",
        preconditions: "Signed in as User B.",
        steps: [
          "As User B, untick email for the rule's notification type in preferences.",
          "As User A, save a Monument tile.",
          "Check User B's bell icon and User B's email inbox.",
          "After the test, re-enable email so subsequent tests work."
        ],
        expected: "User B sees the bell notification. User B receives no email."
      },
      {
        id: "n08",
        title: "Change-detection rule fires only on tracked node",
        preconditions: "Admin has added a second rule with Specific node set to a single text node (e.g. Status).",
        steps: [
          "As User A, open a Monument and change the Status value, save.",
          "Check User B's notifications.",
          "As User A, edit a different field (not Status), save.",
          "Check User B's notifications again."
        ],
        expected: "After step 2: User B receives a new notification. After step 4: User B does not receive another notification from the Status rule."
      },
      {
        id: "n09",
        title: "Message tokens are replaced",
        preconditions: "Admin has changed the rule's message to: {name} — new status is \"{value:status}\".",
        steps: [
          "As User A, set the status field to 'In review' and save.",
          "Check User B's bell notification."
        ],
        expected: "The message shows the actual resource name and the value 'In review' in place of the placeholders — e.g. \"My Monument — new status is 'In review'\". Both {name} and {value:...} are replaced with real data."
      },
      {
        id: "n10",
        title: "Multiple recipients all get notified",
        preconditions: "Admin has added a third user (User C) to the Resource Editor group.",
        steps: [
          "As User A, save a Monument tile.",
          "Check User B's notifications.",
          "Check User C's notifications."
        ],
        expected: "Both User B and User C see the bell notification. Both receive the email if email is enabled in their preferences."
      },
      {
        id: "n11",
        title: "Rule deletion removes entry from preferences",
        preconditions: "Signed in as admin.",
        steps: [
          "As admin, open the graph designer for Monument, go to Functions.",
          "Open the notify-on-tile-save function panel.",
          "Click the trash icon on a rule. Click Save Edits.",
          "Sign in as User B, open Notification preferences."
        ],
        expected: "The deleted rule no longer appears in User B's preferences list."
      },
      {
        id: "n12",
        title: "Resource name prefix filter",
        preconditions: "Admin has set Require prefix to TEST- on an existing rule.",
        steps: [
          "As User A, create a Monument whose name starts with TEST- (e.g. TEST-001). Save the watched nodegroup.",
          "Check User B's bell.",
          "As User A, create another Monument whose name does not start with TEST-. Save the watched nodegroup.",
          "Check User B's bell."
        ],
        expected: "After step 2: User B sees a notification. After step 4: User B does not see a new notification — the rule was skipped because the name didn't start with TEST-."
      },
      {
        id: "n13",
        title: "Empty link path defaults to resource page",
        preconditions: "Admin has left Link path blank on a rule with email enabled.",
        steps: [
          "As User A, save a watched tile on a Monument.",
          "Open the email User B receives.",
          "Click View resource."
        ],
        expected: "The button takes User B to that specific Monument's report page, not a generic landing page."
      },
      {
        id: "n14",
        title: "Custom link path overrides the default",
        preconditions: "Admin has set Link path to /index.htm on the rule.",
        steps: [
          "As User A, save a watched tile.",
          "Open User B's email and click View resource."
        ],
        expected: "The button takes User B to /index.htm instead of the resource report."
      },
      {
        id: "n15",
        title: "Dismissing a notification works",
        preconditions: "User B has at least one notification in the bell dropdown.",
        steps: [
          "As User B, open the bell dropdown.",
          "Click the X (dismiss) on a notification."
        ],
        expected: "The notification disappears from the list. It does not reappear on the next page load."
      },
      {
        id: "n16",
        title: "Existing download notifications still work",
        preconditions: "The project uses Arches download/export. Skip if not applicable.",
        steps: [
          "As User A, trigger a large export/download from Arches.",
          "Wait for the Download ready notification to appear in the bell."
        ],
        expected: "The notification appears. Clicking Download Zip File triggers the file download. The Open resource override does not interfere."
      }
    ]
  }
]
