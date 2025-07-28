const Session = require('../models/Session');

class AutoSaveService {
  constructor() {
    this.pendingSaves = new Map(); // sessionId -> timeout
    this.saveDelay = 2000; // 2 seconds delay for debouncing
  }

  /**
   * Auto-save session state with debouncing
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID
   * @param {object} stateUpdate - State updates to save
   */
  async autoSave(sessionId, userId, stateUpdate) {
    try {
      // Guard against undefined or empty stateUpdate
      if (!stateUpdate || typeof stateUpdate !== 'object') {
        console.warn(`⚠️ autoSave called with invalid stateUpdate for session ${sessionId}`);
        return;
      }

      // Clear existing pending save for this session
      if (this.pendingSaves.has(sessionId)) {
        clearTimeout(this.pendingSaves.get(sessionId));
      }

      // Set new debounced save
      const timeoutId = setTimeout(async () => {
        try {
          await this.performSave(sessionId, userId, stateUpdate);
          this.pendingSaves.delete(sessionId);
          console.log(`📁 Auto-saved session ${sessionId}`);
        } catch (error) {
          console.error('Auto-save error:', error);
        }
      }, this.saveDelay);

      this.pendingSaves.set(sessionId, timeoutId);
    } catch (error) {
      console.error('Auto-save setup error:', error);
    }
  }

  /**
   * Immediately save session state
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID
   * @param {object} stateUpdate - State updates to save
   */
  async forceSave(sessionId, userId, stateUpdate) {
    try {
      if (this.pendingSaves.has(sessionId)) {
        clearTimeout(this.pendingSaves.get(sessionId));
        this.pendingSaves.delete(sessionId);
      }

      await this.performSave(sessionId, userId, stateUpdate);
      console.log(`💾 Force-saved session ${sessionId}`);
    } catch (error) {
      console.error('Force save error:', error);
    }
  }

  /**
   * Perform the actual save operation
   * @param {string} sessionId - Session ID  
   * @param {string} userId - User ID
   * @param {object} stateUpdate - State updates to save
   */
  async performSave(sessionId, userId, stateUpdate) {
    const updateData = {
      lastActiveAt: new Date(),
      updatedAt: new Date(),
    };

    // Guard clause
    if (!stateUpdate || typeof stateUpdate !== 'object') {
      console.warn(`⚠️ performSave called with invalid or empty stateUpdate. Skipping save for session ${sessionId}`);
      return;
    }

    // Build current state update safely
    if (stateUpdate.currentCode !== undefined) {
      updateData['currentState.currentCode'] = stateUpdate.currentCode;
    }

    if (stateUpdate.currentCSS !== undefined) {
      updateData['currentState.currentCSS'] = stateUpdate.currentCSS;
    }

    if (stateUpdate.currentPrompt !== undefined) {
      updateData['currentState.currentPrompt'] = stateUpdate.currentPrompt;
    }

    if (stateUpdate.expandedSection !== undefined) {
      updateData['currentState.expandedSection'] = stateUpdate.expandedSection;
    }

    // Handle chat history updates
    if (stateUpdate.chatHistory) {
      if (stateUpdate.append) {
        await Session.findOneAndUpdate(
          { _id: sessionId, userId },
          {
            ...updateData,
            $push: { 'currentState.chatHistory': { $each: stateUpdate.chatHistory } }
          }
        );
        return;
      } else {
        updateData['currentState.chatHistory'] = stateUpdate.chatHistory;
      }
    }

    // Increment generation count
    if (stateUpdate.incrementGenerations) {
      updateData.$inc = { totalGenerations: 1 };
    }

    await Session.findOneAndUpdate(
      { _id: sessionId, userId },
      updateData,
      { new: true }
    );
  }

  /**
   * Save new chat message
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID
   * @param {string} sender - 'user' or 'ai'
   * @param {string} message - Message content
   * @param {string} associatedCode - Optional associated code
   */
  async saveChatMessage(sessionId, userId, sender, message, associatedCode = '') {
    const chatMessage = {
      sender,
      message,
      timestamp: new Date(),
      associatedCode,
    };

    await this.autoSave(sessionId, userId, {
      chatHistory: [chatMessage],
      append: true,
    });
  }

  /**
   * Get session state for resuming
   * @param {string} sessionId - Session ID
   * @param {string} userId - User ID
   * @returns {object} Session state
   */
  async getSessionState(sessionId, userId) {
    try {
      const session = await Session.findOne(
        { _id: sessionId, userId },
        { currentState: 1, lastActiveAt: 1, totalGenerations: 1 }
      );

      if (!session) {
        return null;
      }

      return {
        currentCode: session.currentState?.currentCode || '',
        currentCSS: session.currentState?.currentCSS || '',
        currentPrompt: session.currentState?.currentPrompt || '',
        chatHistory: session.currentState?.chatHistory || [],
        expandedSection: session.currentState?.expandedSection || 'prompt',
        lastActiveAt: session.lastActiveAt,
        totalGenerations: session.totalGenerations || 0,
      };
    } catch (error) {
      console.error('Get session state error:', error);
      return null;
    }
  }

  /**
   * Get user's last active session
   * @param {string} userId - User ID
   * @returns {object} Last active session info
   */
  async getLastActiveSession(userId) {
    try {
      const session = await Session.findOne(
        { userId },
        { _id: 1, name: 1, lastActiveAt: 1, currentState: 1 }
      ).sort({ lastActiveAt: -1 });

      if (!session) {
        return null;
      }

      return {
        sessionId: session._id,
        sessionName: session.name,
        lastActiveAt: session.lastActiveAt,
        hasState: !!(
          session.currentState?.currentCode || 
          session.currentState?.chatHistory?.length > 0
        ),
      };
    } catch (error) {
      console.error('Get last active session error:', error);
      return null;
    }
  }

  /**
   * Clean up old auto-save data (run periodically)
   * @param {number} daysOld - Days old to consider for cleanup
   */
  async cleanupOldStates(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const result = await Session.updateMany(
        { lastActiveAt: { $lt: cutoffDate } },
        {
          $unset: {
            'currentState.chatHistory': '',
            'currentState.currentCode': '',
            'currentState.currentCSS': '',
            'currentState.currentPrompt': '',
          }
        }
      );

      console.log(`Cleaned up ${result.modifiedCount} old session states`);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }
}

module.exports = new AutoSaveService();
