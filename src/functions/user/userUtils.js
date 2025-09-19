const { prisma } = require("../../lib/prisma");

// ====== EBOARD FUNCTIONS ======
async function isEboardUser(userId) {
  try {
    // Check if user exists and is on eboard
    const user = await prisma.user.findUnique({
      where: {
        userID: userId,
      },
      select: {
        ebaord: true, // Note: This matches your schema field name
      },
    });

    // Return true if user exists and is on eboard
    return user ? user.ebaord : false;
  } catch (error) {
    console.error("Error checking eboard status:", error);
    return false;
  }
}

// ====== PROJECT LEADER FUNCTIONS ======
async function isLeadUser(userId) {
  try {
    // Check if user is a lead on at least one project
    const leadCount = await prisma.projectLead.count({
      where: {
        user: {
          userID: userId
        }
      }
    });

    return leadCount > 0;
  } catch (error) {
    console.error("Error checking lead status:", error);
    return false;
  }
}

async function getUserProjectsAsLead(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        userID: userId,
      },
      include: {
        projectsLed: {
          include: {
            project: {
              include: {
                usersAssigned: {
                  include: {
                    user: true
                  }
                },
                leads: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return user ? user.projectsLed.map(pl => pl.project) : [];
  } catch (error) {
    console.error("Error getting user's led projects:", error);
    return [];
  }
}

async function canUserEditProject(userId, projectId) {
  try {
    // Check if user is eboard OR is a lead on this specific project
    const isEboard = await isEboardUser(userId);
    if (isEboard) return true;

    const leadCount = await prisma.projectLead.count({
      where: {
        projectId: parseInt(projectId),
        user: {
          userID: userId
        }
      }
    });

    return leadCount > 0;
  } catch (error) {
    console.error("Error checking project edit permissions:", error);
    return false;
  }
}

// ====== GENERAL USER FUNCTIONS ======
async function userExists(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        userID: userId,
      },
      select: {
        id: true,
      },
    });

    return user !== null;
  } catch (error) {
    console.error("Error checking if user exists:", error);
    return false;
  }
}

async function getUserInfo(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        userID: userId,
      },
      include: {
        projectsAssigned: {
          include: {
            project: true,
          },
        },
        projectsLed: {
          include: {
            project: true,
          },
        },
      },
    });

    return user;
  } catch (error) {
    console.error("Error getting user info:", error);
    return null;
  }
}

async function registerUser(userId, username, email, isEboard = false) {
  try {
    const user = await prisma.user.create({
      data: {
        userID: userId,
        username: username,
        email: email,
        ebaord: isEboard
      }
    });

    return user;
  } catch (error) {
    console.error("Error registering user:", error);
    return null;
  }
}

async function updateUserEboardStatus(userId, isEboard) {
  try {
    const user = await prisma.user.update({
      where: {
        userID: userId
      },
      data: {
        ebaord: isEboard
      }
    });

    return user;
  } catch (error) {
    console.error("Error updating user eboard status:", error);
    return null;
  }
}

module.exports = {
  // Eboard functions
  isEboardUser,
  updateUserEboardStatus,
  
  // Leader functions
  isLeadUser,
  getUserProjectsAsLead,
  canUserEditProject,
  
  // General user functions
  userExists,
  getUserInfo,
  registerUser,
};