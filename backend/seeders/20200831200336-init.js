'use strict';
const { user, post, comment } = require('../models')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */

    const user1 = await user.create({
      username: "cchyung"
    })

    const user2 = await user.create({
      username: "johndoe123"
    })

    const post1 = await post.create({
      contents: 'hello world',
      userID: user1.id
    })

    const post2 = await post.create({
      contents: 'this is a second post',
      userID: user2.id
    })

    const comment1 = await comment.create({
      contents: "wow!",
      userID: user1.id,
      postID: post2.id
    })

  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('users')
    await queryInterface.bulkDelete('posts')
    await queryInterface.bulkDelete('comments')
  }
};
