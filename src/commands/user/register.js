const {
  SlashCommandBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
} = require("discord.js");
const { prisma } = require("../../lib/prisma");
const { userExists } = require("../../functions/user/userUtils");
const emailService = require("../../services/emailService");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register yourself for the AI Club")
    .addStringOption((option) =>
      option
        .setName("email")
        .setDescription("Your school email address (must end with .edu)")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("full_name")
        .setDescription("Your full name")
        .setRequired(true)
    ),

  async execute(interaction) {
    try {
      const email = interaction.options.getString("email").toLowerCase().trim();
      const fullName = interaction.options.getString("full_name").trim();
      const userId = interaction.user.id;
      const username = interaction.user.username;

      // Validate email format and domain
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        const embed = new EmbedBuilder()
          .setTitle("❌ Invalid Email Format")
          .setDescription("Please provide a valid email address.")
          .setColor("#FF6B6B");

        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Check if email ends with .edu (school email)
      if (!email.endsWith(".edu")) {
        const embed = new EmbedBuilder()
          .setTitle("❌ School Email Required")
          .setDescription(
            "Please use your school email address (must end with `.edu`)."
          )
          .addFields({
            name: "Examples of valid emails:",
            value: "• `student@g.rit.edu`\n• `john.doe@rit.edu`",
            inline: false,
          })
          .setColor("#FF6B6B");

        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Check if user is already registered and verified
      const existingUser = await prisma.user.findUnique({
        where: { userID: userId },
      });

      if (existingUser && existingUser.emailVerified) {
        // Get project stats
        const userWithProjects = await prisma.user.findUnique({
          where: { userID: userId },
          include: {
            projectsAssigned: true,
            projectsLed: true,
          },
        });

        const projectCount = userWithProjects?.projectsAssigned?.length || 0;
        const leadCount = userWithProjects?.projectsLed?.length || 0;

        const embed = new EmbedBuilder()
          .setTitle("ℹ️ Already Registered")
          .setDescription(
            `You're already registered and verified in the AI Club system!`
          )
          .addFields(
            { name: "📧 Email", value: existingUser.email, inline: true },
            {
              name: "📅 Registered",
              value: `<t:${Math.floor(
                existingUser.createdAt.getTime() / 1000
              )}:R>`,
              inline: true,
            },
            {
              name: "📊 Stats",
              value: `**${projectCount}** projects assigned\n**${leadCount}** projects led`,
              inline: true,
            }
          )
          .setColor("#FFA500");

        if (existingUser.email !== email) {
          embed.addFields({
            name: "📝 Email Update",
            value: `If you need to update your email from \`${existingUser.email}\` to \`${email}\`, please contact an eboard member.`,
            inline: false,
          });
        }

        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Check if email is already used by another verified user
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: email,
          emailVerified: true,
        },
      });

      if (existingEmail) {
        const embed = new EmbedBuilder()
          .setTitle("❌ Email Already Registered")
          .setDescription(
            `The email \`${email}\` is already registered and verified by another user.`
          )
          .setColor("#FF6B6B");

        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Generate verification code and expiration (15 minutes)
      const verificationCode = emailService.generateVerificationCode();
      const verificationExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

      // Create or update user with verification code
      const userData = {
        userID: userId,
        username: username,
        email: email,
        emailVerified: false,
        verificationCode: verificationCode,
        verificationExpires: verificationExpires,
        ebaord: false,
      };

      if (existingUser) {
        // Update existing unverified user
        await prisma.user.update({
          where: { id: existingUser.id },
          data: userData,
        });
      } else {
        // Create new user
        await prisma.user.create({
          data: userData,
        });
      }

      // Send verification email
      const emailSent = await emailService.sendVerificationEmail(
        email,
        fullName,
        verificationCode
      );

      if (!emailSent) {
        const embed = new EmbedBuilder()
          .setTitle("❌ Email Sending Failed")
          .setDescription(
            "Failed to send verification email. Please try again or contact an eboard member."
          )
          .setColor("#FF6B6B");

        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Create verification button
      const verifyButton = new ButtonBuilder()
        .setCustomId(`verify_email_${userId}`)
        .setLabel("Enter Verification Code")
        .setStyle(ButtonStyle.Primary)
        .setEmoji("📧");

      const buttonRow = new ActionRowBuilder().addComponents(verifyButton);

      // Send response with button
      const embed = new EmbedBuilder()
        .setTitle("📧 Verification Email Sent!")
        .setDescription(`A verification email has been sent to \`${email}\``)
        .addFields(
          {
            name: "📋 Next Steps",
            value:
              "1. Check your email inbox (and spam folder)\n2. Find the 6-digit verification code\n3. Click the button below to enter your code",
            inline: false,
          },
          {
            name: "⏰ Important",
            value:
              "• The verification code expires in **15 minutes**\n• Check your spam folder if you don't see the email",
            inline: false,
          },
          {
            name: "🔄 Alternative",
            value: "You can also use `/verify code:<your-code>` command",
            inline: false,
          }
        )
        .setColor("#4ECDC4")
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        components: [buttonRow],
        ephemeral: true,
      });

      console.log(
        `📧 Verification email sent to: ${username} (${userId}) - ${email}`
      );
    } catch (error) {
      console.error("Error executing register command:", error);

      const embed = new EmbedBuilder()
        .setTitle("❌ Registration Error")
        .setDescription(
          "An unexpected error occurred during registration. Please try again later or contact an eboard member."
        )
        .setColor("#FF6B6B");

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
