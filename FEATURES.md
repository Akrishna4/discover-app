# Part A: Growth & Engagement Product Proposals for Coy

Coy's core promise is uncompromising privacy: you never learn who likes you unless the feeling is mutual. The following two feature proposals are designed to accelerate user acquisition and post-match engagement while upholding this privacy guarantee.

---

## Feature 1: Earn Extra Crush Slots by Inviting Friends

### Concept & Mechanics
Users receive a baseline number of active "Crush Slots" (e.g. 5). Users can earn additional permanent or temporary crush slots by inviting friends via a unique referral link. A slot is credited to the inviter's account **only after the invitee completes both phone and email verification**.

### Why This Works for Coy
1. **Network Density & Match Liquidity**: Coy only works when both people are on the app. Organic word-of-mouth growth directly expands the candidate graph, which multiplicatively increases match probability for all participants.
2. **Reward Loop**: Turning the viral invite link into a tangible product reward gives users an immediate incentive to share Coy within their social circles and college campuses.
3. **Nudges Paid Conversion**: By anchoring value to crush slots, power users who run out of invites can be smoothly nudged toward a paid tier (e.g. purchasing extra slots or Coy Gold).
4. **Fraud & Sybil Resistance**: Verification gating (requiring both phone and email confirmation) prevents users from spinning up disposable accounts or abusing fake emails to harvest slots.

### Privacy Note
Invites and crushes are kept strictly isolated in the database and user experience. An invite link is generic (`coy.app/join?ref=xyz`) and gives no hint about whom the inviter has liked or intended to crush on. Even if User A invites User B and immediately places User B in their newly earned crush slot, User B receives zero indication of this until User B organically joins and independently chooses to like User A.

---

## Feature 2: Time-Limited Icebreaker Chat After a Match

### Concept & Mechanics
Once a mutual match occurs, a dedicated, ephemeral conversation window opens with a **24–48 hour countdown timer**. The chat UI provides playful, curated prompt starters based on shared interests (e.g., *"Ask Priya about Carnatic music"* or *"Debate Aarav on midnight chai vs coffee"*). If neither person sends a message within the window, the match expires and fades away. If a conversation starts, the timer converts into standard open messaging.

### Why This Works for Coy
1. **Solves the "Match Dead-End"**: A match currently produces a celebratory moment but leaves users with no immediate structured next step. Icebreaker chats provide momentum.
2. **Eliminates First-Message Awkwardness**: Contextual prompt starters remove the psychological friction of opening with a boring "Hey", drastically boosting first-message response rates.
3. **Urgency Drives Action**: The 24–48 hour countdown creates a healthy sense of urgency, nudging users to check in and reply quickly rather than letting matches sit indefinitely.
4. **Retention After the Match**: Directly improves Day-1 and Day-7 retention by keeping users actively returning to the app during the critical post-match window.

### Privacy & Safety Note
- **In-Chat Safety Controls**: Instant block and report actions are accessible directly from the conversation header; blocking immediately terminates the chat and purges the connection.
- **Zero Contact Info Leakage**: Real phone numbers, social handles, and personal emails are never shared or surfaced until both users explicitly opt in to exchange contact cards.
