exports.up = (pgm) => {
  const columns = {
      id: { type: 'serial', primaryKey: true },
      email: { type: 'string', notNull: true}
  }
  pgm.createTable('users', columns)
};

exports.down = (pgm) => {
  pgm.dropTable('users')
};
