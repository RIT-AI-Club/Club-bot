const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { prisma } = require('../lib/prisma');

module.exports = {
  async handleVerificationButton(interaction) {
    const userId = interaction.customId.split('_')[2];
    
    if (interaction.user.id !== userId) {
      return await interaction.reply({
        content: '❌ This verification is not for your account.',
        ephemeral: true
      });
    }

    // Create the verification modal
    const modal = new ModalBuilder()
      .setCustomId(`verify_modal_${userId}`)
      .setTitle('🤖 RIT AI Club - Email Verification');

    const verificationInput = new TextInputBuilder()
      .setCustomId('verification_code')
      .setLabel('Enter your 6-digit verification code')
      .setPlaceholder('123456')
      .setStyle(TextInputStyle.Short)
      .setMinLength(6)
      .setMaxLength(6)
      .setRequired(true);

    const actionRow = new ActionRowBuilder().addComponents(verificationInput);
    modal.addComponents(actionRow);

    await interaction.showModal(modal);
  },

  async handleVerificationModal(interaction) {
    const userId = interaction.customId.split('_')[2];
    const enteredCode = interaction.fields.getTextInputValue('verification_code').trim();

    try {
      const user = await prisma.user.findFirst({
        where: {
          userID: userId,
          verificationCode: enteredCode,
          emailVerified: false
        }
      });

      if (!user) {
        const embed = new EmbedBuilder()
          .setTitle("❌ Invalid Verification Code")
          .setDescription("The verification code is incorrect or you're already verified.")
          .addFields({
            name: "🔧 Need Help?",
            value: "• Make sure you entered the 6-digit code correctly\n• Check if your email is already verified\n• Use `/register` again if the code expired\n• Contact eboard if you're still having issues",
            inline: false
          })
          .setColor("#FF6B6B");

        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const now = new Date();
      if (user.verificationExpires && now > user.verificationExpires) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            verificationCode: null,
            verificationExpires: null
          }
        });

        const embed = new EmbedBuilder()
          .setTitle("⏰ Verification Code Expired")
          .setDescription("Your verification code has expired (codes are valid for 15 minutes).")
          .addFields({
            name: "🔄 What to do next:",
            value: "Use `/register` again with your email to receive a new verification code.",
            inline: false
          })
          .setColor("#FFA500");

        return await interaction.reply({ embeds: [embed], ephemeral: true });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: true,
          verificationCode: null,
          verificationExpires: null
        }
      });

      const embed = new EmbedBuilder()
        .setTitle("✅ Email Verified Successfully!")
        .setDescription(`Welcome to the RIT AI Club, ${user.username}! 🎉`)
        .addFields(
          { name: "📧 Verified Email", value: user.email, inline: true },
          { name: "📅 Verification Date", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
          { name: "🎯 Status", value: "✅ Fully Registered", inline: true }
        )
        .addFields({
          name: "🚀 You can now:",
          value: "• Browse projects with `/projects`\n• Get assigned to projects by eboard\n• Contact project leads with `/contact`\n• Participate in all club activities!",
          inline: false
        })
        .setColor("#4ECDC4")
        .setTimestamp()
        .setFooter({ text: "RIT AI Club - Registration Complete" });

      await interaction.reply({ embeds: [embed] });

      console.log(`✅ User verified via modal: ${user.username} (${userId}) - ${user.email}`);

    } catch (error) {
      console.error('Error handling verification modal:', error);
      
      const embed = new EmbedBuilder()
        .setTitle("❌ Verification Error")
        .setDescription("An unexpected error occurred during verification. Please try again or contact an eboard member.")
        .setColor("#FF6B6B");

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};