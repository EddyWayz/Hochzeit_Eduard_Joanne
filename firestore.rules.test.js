/**
 * Firestore Security Rules Tests
 * Tests the security rules defined in firestore.rules
 */

const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails
} = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

let testEnv;

beforeAll(async () => {
  // Initialize test environment with security rules
  testEnv = await initializeTestEnvironment({
    projectId: 'hochzeiteduardjoanne-test',
    firestore: {
      rules: fs.readFileSync(path.join(__dirname, 'firestore.rules'), 'utf8'),
      host: 'localhost',
      port: 8080
    }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('RSVP Collection Rules', () => {
  const validRsvpData = {
    familyName: 'Mustermann',
    email: 'test@example.com',
    attending: 'yes',
    guests: 2,
    timestamp: new Date()
  };

  describe('Create RSVP', () => {
    test('anyone can create a valid RSVP', async () => {
      const unauthContext = testEnv.unauthenticatedContext();
      await assertSucceeds(
        unauthContext.firestore().collection('rsvps').add(validRsvpData)
      );
    });

    test('should reject RSVP without familyName', async () => {
      const unauthContext = testEnv.unauthenticatedContext();
      const invalidData = { ...validRsvpData };
      delete invalidData.familyName;

      await assertFails(
        unauthContext.firestore().collection('rsvps').add(invalidData)
      );
    });

    test('should reject RSVP without email', async () => {
      const unauthContext = testEnv.unauthenticatedContext();
      const invalidData = { ...validRsvpData };
      delete invalidData.email;

      await assertFails(
        unauthContext.firestore().collection('rsvps').add(invalidData)
      );
    });

    test('should reject RSVP with invalid email format', async () => {
      const unauthContext = testEnv.unauthenticatedContext();
      const invalidData = {
        ...validRsvpData,
        email: 'invalid-email' // Missing @ and domain
      };

      await assertFails(
        unauthContext.firestore().collection('rsvps').add(invalidData)
      );
    });

    test('should reject RSVP with invalid attending value', async () => {
      const unauthContext = testEnv.unauthenticatedContext();
      const invalidData = {
        ...validRsvpData,
        attending: 'maybe' // Only 'yes' or 'no' allowed
      };

      await assertFails(
        unauthContext.firestore().collection('rsvps').add(invalidData)
      );
    });

    test('should reject RSVP with guests > 10', async () => {
      const unauthContext = testEnv.unauthenticatedContext();
      const invalidData = {
        ...validRsvpData,
        guests: 11 // Max is 10
      };

      await assertFails(
        unauthContext.firestore().collection('rsvps').add(invalidData)
      );
    });

    test('should reject RSVP with guests < 0', async () => {
      const unauthContext = testEnv.unauthenticatedContext();
      const invalidData = {
        ...validRsvpData,
        guests: -1
      };

      await assertFails(
        unauthContext.firestore().collection('rsvps').add(invalidData)
      );
    });

    test('should reject RSVP with attending=yes and guests=0', async () => {
      const unauthContext = testEnv.unauthenticatedContext();
      const invalidData = {
        ...validRsvpData,
        attending: 'yes',
        guests: 0 // Must be >= 1 when attending
      };

      await assertFails(
        unauthContext.firestore().collection('rsvps').add(invalidData)
      );
    });

    test('should allow RSVP with attending=no and guests=0', async () => {
      const unauthContext = testEnv.unauthenticatedContext();
      const validData = {
        ...validRsvpData,
        attending: 'no',
        guests: 0
      };

      await assertSucceeds(
        unauthContext.firestore().collection('rsvps').add(validData)
      );
    });
  });

  describe('Read RSVP', () => {
    test('anyone can read RSVPs', async () => {
      const adminContext = testEnv.authenticatedContext('admin@example.com');
      const unauthContext = testEnv.unauthenticatedContext();

      // Admin creates RSVP
      const docRef = await adminContext.firestore().collection('rsvps').add(validRsvpData);

      // Unauthenticated user can read it
      await assertSucceeds(
        unauthContext.firestore().collection('rsvps').doc(docRef.id).get()
      );
    });
  });

  describe('Update RSVP', () => {
    test('anyone can update RSVP with valid data', async () => {
      const unauthContext = testEnv.unauthenticatedContext();

      // Create RSVP
      const docRef = await unauthContext.firestore().collection('rsvps').add(validRsvpData);

      // Update with valid data
      await assertSucceeds(
        unauthContext.firestore().collection('rsvps').doc(docRef.id).update({
          guests: 3,
          intolerances: 'Glutenfrei'
        })
      );
    });

    test('should reject update with invalid email', async () => {
      const unauthContext = testEnv.unauthenticatedContext();

      const docRef = await unauthContext.firestore().collection('rsvps').add(validRsvpData);

      await assertFails(
        unauthContext.firestore().collection('rsvps').doc(docRef.id).update({
          email: 'invalid-email'
        })
      );
    });

    test('should reject update with guests > 10', async () => {
      const unauthContext = testEnv.unauthenticatedContext();

      const docRef = await unauthContext.firestore().collection('rsvps').add(validRsvpData);

      await assertFails(
        unauthContext.firestore().collection('rsvps').doc(docRef.id).update({
          guests: 11
        })
      );
    });
  });

  describe('Delete RSVP', () => {
    test('unauthenticated users cannot delete RSVPs', async () => {
      const adminContext = testEnv.authenticatedContext('admin@example.com');
      const unauthContext = testEnv.unauthenticatedContext();

      const docRef = await adminContext.firestore().collection('rsvps').add(validRsvpData);

      await assertFails(
        unauthContext.firestore().collection('rsvps').doc(docRef.id).delete()
      );
    });

    test('authenticated admin can delete RSVPs', async () => {
      const adminContext = testEnv.authenticatedContext('admin@example.com');

      const docRef = await adminContext.firestore().collection('rsvps').add(validRsvpData);

      await assertSucceeds(
        adminContext.firestore().collection('rsvps').doc(docRef.id).delete()
      );
    });
  });
});

describe('Gifts Collection Rules', () => {
  const validGiftData = {
    name: 'Kaffeemaschine',
    reserved: false,
    createdAt: new Date()
  };

  describe('Read Gifts', () => {
    test('anyone can read gifts', async () => {
      const adminContext = testEnv.authenticatedContext('admin@example.com');
      const unauthContext = testEnv.unauthenticatedContext();

      const docRef = await adminContext.firestore().collection('gifts').add(validGiftData);

      await assertSucceeds(
        unauthContext.firestore().collection('gifts').doc(docRef.id).get()
      );
    });
  });

  describe('Create Gifts', () => {
    test('only admin can create gifts', async () => {
      const adminContext = testEnv.authenticatedContext('admin@example.com');

      await assertSucceeds(
        adminContext.firestore().collection('gifts').add(validGiftData)
      );
    });

    test('unauthenticated users cannot create gifts', async () => {
      const unauthContext = testEnv.unauthenticatedContext();

      await assertFails(
        unauthContext.firestore().collection('gifts').add(validGiftData)
      );
    });

    test('should reject gift creation with reserved=true', async () => {
      const adminContext = testEnv.authenticatedContext('admin@example.com');
      const invalidData = {
        ...validGiftData,
        reserved: true
      };

      await assertFails(
        adminContext.firestore().collection('gifts').add(invalidData)
      );
    });
  });

  describe('Reserve Gifts', () => {
    test('anyone can reserve an unreserved gift', async () => {
      const adminContext = testEnv.authenticatedContext('admin@example.com');
      const unauthContext = testEnv.unauthenticatedContext();

      const docRef = await adminContext.firestore().collection('gifts').add(validGiftData);

      await assertSucceeds(
        unauthContext.firestore().collection('gifts').doc(docRef.id).update({
          reserved: true,
          reserverEmail: 'guest@example.com'
        })
      );
    });

    test('should reject reservation without reserverEmail', async () => {
      const adminContext = testEnv.authenticatedContext('admin@example.com');
      const unauthContext = testEnv.unauthenticatedContext();

      const docRef = await adminContext.firestore().collection('gifts').add(validGiftData);

      await assertFails(
        unauthContext.firestore().collection('gifts').doc(docRef.id).update({
          reserved: true
          // Missing reserverEmail
        })
      );
    });

    test('should reject reservation with invalid email format', async () => {
      const adminContext = testEnv.authenticatedContext('admin@example.com');
      const unauthContext = testEnv.unauthenticatedContext();

      const docRef = await adminContext.firestore().collection('gifts').add(validGiftData);

      await assertFails(
        unauthContext.firestore().collection('gifts').doc(docRef.id).update({
          reserved: true,
          reserverEmail: 'invalid-email'
        })
      );
    });

    test('cannot change from reserved to unreserved (unless admin)', async () => {
      const adminContext = testEnv.authenticatedContext('admin@example.com');
      const unauthContext = testEnv.unauthenticatedContext();

      // Create and reserve gift
      const docRef = await adminContext.firestore().collection('gifts').add({
        ...validGiftData,
        reserved: true,
        reserverEmail: 'guest@example.com'
      });

      // Non-admin cannot unreserve
      await assertFails(
        unauthContext.firestore().collection('gifts').doc(docRef.id).update({
          reserved: false
        })
      );
    });
  });

  describe('Update Gifts (Admin)', () => {
    test('admin can update any gift field', async () => {
      const adminContext = testEnv.authenticatedContext('admin@example.com');

      const docRef = await adminContext.firestore().collection('gifts').add(validGiftData);

      await assertSucceeds(
        adminContext.firestore().collection('gifts').doc(docRef.id).update({
          name: 'Neue Kaffeemaschine',
          description: 'Mit Milchaufschäumer'
        })
      );
    });

    test('admin can unreserve gifts', async () => {
      const adminContext = testEnv.authenticatedContext('admin@example.com');

      const docRef = await adminContext.firestore().collection('gifts').add({
        ...validGiftData,
        reserved: true,
        reserverEmail: 'guest@example.com'
      });

      await assertSucceeds(
        adminContext.firestore().collection('gifts').doc(docRef.id).update({
          reserved: false
        })
      );
    });
  });

  describe('Delete Gifts', () => {
    test('only admin can delete gifts', async () => {
      const adminContext = testEnv.authenticatedContext('admin@example.com');

      const docRef = await adminContext.firestore().collection('gifts').add(validGiftData);

      await assertSucceeds(
        adminContext.firestore().collection('gifts').doc(docRef.id).delete()
      );
    });

    test('unauthenticated users cannot delete gifts', async () => {
      const adminContext = testEnv.authenticatedContext('admin@example.com');
      const unauthContext = testEnv.unauthenticatedContext();

      const docRef = await adminContext.firestore().collection('gifts').add(validGiftData);

      await assertFails(
        unauthContext.firestore().collection('gifts').doc(docRef.id).delete()
      );
    });
  });
});

describe('Security - Unknown Collections', () => {
  test('should deny access to unknown collections', async () => {
    const unauthContext = testEnv.unauthenticatedContext();

    await assertFails(
      unauthContext.firestore().collection('unknown').add({ test: 'data' })
    );
  });

  test('should deny read access to unknown collections', async () => {
    const unauthContext = testEnv.unauthenticatedContext();

    await assertFails(
      unauthContext.firestore().collection('unknown').doc('test').get()
    );
  });
});
