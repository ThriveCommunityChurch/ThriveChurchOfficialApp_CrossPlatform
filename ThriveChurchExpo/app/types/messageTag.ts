/**
 * Categorizes sermon messages by topic/theme to enable better organization and discovery
 */
export enum MessageTag {
  /** Default tag type of unknown is not supported and only used for validation */
  Unknown = -1,

  // Relationships & Family
  /** Topics related to marriage, dating, and romantic relationships */
  Marriage = 0,
  /** Topics related to parenting, children, and family dynamics */
  Family = 1,
  /** Topics related to friendships and community relationships */
  Friendship = 2,
  /** Topics related to singleness and navigating life as a single person */
  Singleness = 3,

  // Financial & Stewardship
  /** Topics related to money management, budgeting, and financial wisdom */
  FinancialStewardship = 4,
  /** Topics related to generosity, tithing, and giving */
  Generosity = 5,

  // Theological Foundations
  /** Topics related to the nature and character of God */
  NatureOfGod = 6,
  /** Topics related to the Trinity (Father, Son, Holy Spirit) */
  Trinity = 7,
  /** Topics related to salvation, grace, and redemption */
  Salvation = 8,
  /** Topics related to the resurrection of Jesus and believers */
  Resurrection = 9,
  /** Topics related to the Holy Spirit and spiritual gifts */
  HolySpirit = 10,
  /** Topics related to the church, ecclesiology, and the body of Christ */
  Church = 11,
  /** Topics related to end times, eschatology, and the return of Christ */
  EndTimes = 12,
  /** Topics related to sin, repentance, and forgiveness */
  SinAndRepentance = 13,
  /** Topics related to faith, belief, and trust in God */
  Faith = 14,
  /** Topics related to sanctification and becoming more Christ-like */
  Sanctification = 15,
  /** Topics related to biblical covenants (Abrahamic, Mosaic, Davidic, New Covenant) */
  Covenant = 16,
  /** Topics related to defending the Christian faith and answering objections */
  Apologetics = 17,

  // Spiritual Disciplines
  /** Topics related to prayer and intercession */
  Prayer = 18,
  /** Topics related to fasting and spiritual discipline */
  Fasting = 19,
  /** Topics related to worship and praise */
  Worship = 20,
  /** Topics related to Bible study and Scripture engagement */
  BibleStudy = 21,
  /** Topics related to meditation and contemplation */
  Meditation = 22,
  /** Topics related to service and ministry to others */
  Service = 23,
  /** Topics related to praise and praising God */
  Praise = 24,

  // Sacraments & Ordinances
  /** Topics related to baptism and its significance */
  Baptism = 25,
  /** Topics related to communion, the Lord's Supper, or Eucharist */
  Communion = 26,

  // Life Stages & Transitions
  /** Topics related to youth and young adult life */
  Youth = 27,
  /** Topics related to aging, retirement, and senior life */
  Aging = 28,
  /** Topics related to grief, loss, and mourning */
  GriefAndLoss = 29,
  /** Topics related to major life transitions and changes */
  LifeTransitions = 30,

  // Social Issues & Justice
  /** Topics related to social justice, equity, and righteousness */
  SocialJustice = 31,
  /** Topics related to racial reconciliation and unity */
  RacialReconciliation = 32,
  /** Topics related to poverty, homelessness, and economic justice */
  Poverty = 33,
  /** Topics related to caring for creation and environmental stewardship */
  Creation = 34,
  /** Topics related to politics, government, and civic engagement */
  Politics = 35,

  // Personal Growth & Character
  /** Topics related to identity in Christ and self-worth */
  Identity = 36,
  /** Topics related to purpose, calling, and vocation */
  Purpose = 37,
  /** Topics related to courage, bravery, and overcoming fear */
  Courage = 38,
  /** Topics related to hope and optimism */
  Hope = 39,
  /** Topics related to love and compassion */
  Love = 40,
  /** Topics related to joy and contentment */
  Joy = 41,
  /** Topics related to peace and rest */
  Peace = 42,
  /** Topics related to patience and perseverance */
  Patience = 43,
  /** Topics related to humility and servanthood */
  Humility = 44,
  /** Topics related to wisdom and discernment */
  Wisdom = 45,
  /** Topics related to integrity and character */
  Integrity = 46,
  /** Topics related to forgiveness and reconciliation */
  Forgiveness = 47,
  /** Topics related to gratitude and thankfulness */
  Gratitude = 48,
  /** Topics related to trust and trusting God in all circumstances */
  Trust = 49,
  /** Topics related to obedience and following God's commands */
  Obedience = 50,
  /** Topics related to contentment and finding satisfaction in God */
  Contentment = 51,
  /** Topics related to pride and dealing with arrogance */
  Pride = 52,
  /** Topics related to fear and overcoming fear with faith */
  Fear = 53,
  /** Topics related to anger and managing it biblically */
  Anger = 54,

  // Challenges & Struggles
  /** Topics related to suffering, trials, and hardship */
  Suffering = 55,
  /** Topics related to doubt and questions of faith */
  Doubt = 56,
  /** Topics related to anxiety, worry, and mental health */
  Anxiety = 57,
  /** Topics related to depression and emotional struggles */
  Depression = 58,
  /** Topics related to addiction and recovery */
  Addiction = 59,
  /** Topics related to temptation and spiritual warfare */
  Temptation = 60,
  /** Topics related to spiritual warfare and battling spiritual forces */
  SpiritualWarfare = 61,
  /** Topics related to persecution and enduring hardship for faith */
  Persecution = 62,

  // Eternal & Supernatural
  /** Topics related to heaven and eternal life */
  Heaven = 63,
  /** Topics related to hell and eternal judgment */
  Hell = 64,

  // Mission & Evangelism
  /** Topics related to evangelism and sharing faith */
  Evangelism = 65,
  /** Topics related to missions and global outreach */
  Missions = 66,
  /** Topics related to discipleship and spiritual growth */
  Discipleship = 67,
  /** Topics related to leadership and influence */
  Leadership = 68,
  /** Topics related to personal evangelism, witnessing, and sharing testimony */
  Witnessing = 69,

  // Biblical Studies
  /** Topics related to the parables of Jesus */
  Parables = 70,
  /** Topics related to the Sermon on the Mount (Matthew 5-7) */
  SermonOnTheMount = 71,
  /** Topics related to the Fruit of the Spirit (Galatians 5:22-23) */
  FruitOfTheSpirit = 72,
  /** Topics related to the Armor of God (Ephesians 6) */
  ArmorOfGod = 73,
  /** Topics related to Old Testament prophets and their messages */
  Prophets = 74,

  // Biblical Book Studies
  /** Sermon series studying the book of Genesis */
  Genesis = 75,
  /** Sermon series studying the book of Exodus */
  Exodus = 76,
  /** Sermon series studying the book of Psalms */
  Psalms = 77,
  /** Sermon series studying the book of Proverbs */
  Proverbs = 78,
  /** Sermon series studying the Gospels (Matthew, Mark, Luke, John) */
  Gospels = 79,
  /** Sermon series studying the book of Acts */
  Acts = 80,
  /** Sermon series studying the book of Romans */
  Romans = 81,
  /** Sermon series studying other Pauline epistles */
  PaulineEpistles = 82,
  /** Sermon series studying Revelation */
  Revelation = 83,
  /** General Old Testament book studies not otherwise categorized */
  OldTestament = 84,
  /** General New Testament book studies not otherwise categorized */
  NewTestament = 85,

  // Seasonal & Liturgical
  /** Topics related to Advent season */
  Advent = 86,
  /** Topics related to Christmas season */
  Christmas = 87,
  /** Topics related to Lent season */
  Lent = 88,
  /** Topics related to Easter season */
  Easter = 89,
  /** Topics related to Pentecost */
  Pentecost = 90,

  // Work & Vocation
  /** Topics related to work, career, and professional life */
  Work = 91,
  /** Topics related to rest, sabbath, and work-life balance */
  Rest = 92,

  // Gender & Relationships
  /** Topics related to biblical manhood and what it means to be a godly man */
  BiblicalManhood = 93,
  /** Topics related to biblical womanhood and what it means to be a godly woman */
  BiblicalWomanhood = 94,
  /** Topics related to sexual purity and biblical sexuality */
  SexualPurity = 95,

  // Other
  /** Topics related to miracles and the supernatural */
  Miracles = 96,
  /** Topics related to prophecy and prophetic ministry */
  Prophecy = 97,
  /** Topics related to healing and restoration */
  Healing = 98,
  /** Topics related to community and fellowship */
  Community = 99,
  /** Topics related to culture and cultural engagement */
  Culture = 100,
  /** Topics related to technology and modern life */
  Technology = 101
}

/**
 * Convert MessageTag enum value to its string name for API serialization
 */
export function getMessageTagName(tag: MessageTag): string {
  return MessageTag[tag];
}

/**
 * Convert string name to MessageTag enum value (for API deserialization)
 */
export function getMessageTagFromName(name: string): MessageTag {
  return (MessageTag as any)[name] ?? MessageTag.Unknown;
}

/**
 * Helper function to get a human-readable label for a MessageTag
 */
export function getMessageTagLabel(tag: MessageTag): string {
  const labels: { [key in MessageTag]: string } = {
    [MessageTag.Unknown]: 'Unknown',
    [MessageTag.Marriage]: 'Marriage',
    [MessageTag.Family]: 'Family',
    [MessageTag.Friendship]: 'Friendship',
    [MessageTag.Singleness]: 'Singleness',
    [MessageTag.FinancialStewardship]: 'Financial Stewardship',
    [MessageTag.Generosity]: 'Generosity',
    [MessageTag.NatureOfGod]: 'Nature of God',
    [MessageTag.Trinity]: 'Trinity',
    [MessageTag.Salvation]: 'Salvation',
    [MessageTag.Resurrection]: 'Resurrection',
    [MessageTag.HolySpirit]: 'Holy Spirit',
    [MessageTag.Church]: 'Church',
    [MessageTag.EndTimes]: 'End Times',
    [MessageTag.SinAndRepentance]: 'Sin & Repentance',
    [MessageTag.Faith]: 'Faith',
    [MessageTag.Sanctification]: 'Sanctification',
    [MessageTag.Covenant]: 'Covenant',
    [MessageTag.Apologetics]: 'Apologetics',
    [MessageTag.Prayer]: 'Prayer',
    [MessageTag.Fasting]: 'Fasting',
    [MessageTag.Worship]: 'Worship',
    [MessageTag.BibleStudy]: 'Bible Study',
    [MessageTag.Meditation]: 'Meditation',
    [MessageTag.Service]: 'Service',
    [MessageTag.Praise]: 'Praise',
    [MessageTag.Baptism]: 'Baptism',
    [MessageTag.Communion]: 'Communion',
    [MessageTag.Youth]: 'Youth',
    [MessageTag.Aging]: 'Aging',
    [MessageTag.GriefAndLoss]: 'Grief & Loss',
    [MessageTag.LifeTransitions]: 'Life Transitions',
    [MessageTag.SocialJustice]: 'Social Justice',
    [MessageTag.RacialReconciliation]: 'Racial Reconciliation',
    [MessageTag.Poverty]: 'Poverty',
    [MessageTag.Creation]: 'Creation',
    [MessageTag.Politics]: 'Politics',
    [MessageTag.Identity]: 'Identity',
    [MessageTag.Purpose]: 'Purpose',
    [MessageTag.Courage]: 'Courage',
    [MessageTag.Hope]: 'Hope',
    [MessageTag.Love]: 'Love',
    [MessageTag.Joy]: 'Joy',
    [MessageTag.Peace]: 'Peace',
    [MessageTag.Patience]: 'Patience',
    [MessageTag.Humility]: 'Humility',
    [MessageTag.Wisdom]: 'Wisdom',
    [MessageTag.Integrity]: 'Integrity',
    [MessageTag.Forgiveness]: 'Forgiveness',
    [MessageTag.Gratitude]: 'Gratitude',
    [MessageTag.Trust]: 'Trust',
    [MessageTag.Obedience]: 'Obedience',
    [MessageTag.Contentment]: 'Contentment',
    [MessageTag.Pride]: 'Pride',
    [MessageTag.Fear]: 'Fear',
    [MessageTag.Anger]: 'Anger',
    [MessageTag.Suffering]: 'Suffering',
    [MessageTag.Doubt]: 'Doubt',
    [MessageTag.Anxiety]: 'Anxiety',
    [MessageTag.Depression]: 'Depression',
    [MessageTag.Addiction]: 'Addiction',
    [MessageTag.Temptation]: 'Temptation',
    [MessageTag.SpiritualWarfare]: 'Spiritual Warfare',
    [MessageTag.Persecution]: 'Persecution',
    [MessageTag.Heaven]: 'Heaven',
    [MessageTag.Hell]: 'Hell',
    [MessageTag.Evangelism]: 'Evangelism',
    [MessageTag.Missions]: 'Missions',
    [MessageTag.Discipleship]: 'Discipleship',
    [MessageTag.Leadership]: 'Leadership',
    [MessageTag.Witnessing]: 'Witnessing',
    [MessageTag.Parables]: 'Parables',
    [MessageTag.SermonOnTheMount]: 'Sermon on the Mount',
    [MessageTag.FruitOfTheSpirit]: 'Fruit of the Spirit',
    [MessageTag.ArmorOfGod]: 'Armor of God',
    [MessageTag.Prophets]: 'Prophets',
    [MessageTag.Genesis]: 'Genesis',
    [MessageTag.Exodus]: 'Exodus',
    [MessageTag.Psalms]: 'Psalms',
    [MessageTag.Proverbs]: 'Proverbs',
    [MessageTag.Gospels]: 'Gospels',
    [MessageTag.Acts]: 'Acts',
    [MessageTag.Romans]: 'Romans',
    [MessageTag.PaulineEpistles]: 'Pauline Epistles',
    [MessageTag.Revelation]: 'Revelation',
    [MessageTag.OldTestament]: 'Old Testament',
    [MessageTag.NewTestament]: 'New Testament',
    [MessageTag.Advent]: 'Advent',
    [MessageTag.Christmas]: 'Christmas',
    [MessageTag.Lent]: 'Lent',
    [MessageTag.Easter]: 'Easter',
    [MessageTag.Pentecost]: 'Pentecost',
    [MessageTag.Work]: 'Work',
    [MessageTag.Rest]: 'Rest',
    [MessageTag.BiblicalManhood]: 'Biblical Manhood',
    [MessageTag.BiblicalWomanhood]: 'Biblical Womanhood',
    [MessageTag.SexualPurity]: 'Sexual Purity',
    [MessageTag.Miracles]: 'Miracles',
    [MessageTag.Prophecy]: 'Prophecy',
    [MessageTag.Healing]: 'Healing',
    [MessageTag.Community]: 'Community',
    [MessageTag.Culture]: 'Culture',
    [MessageTag.Technology]: 'Technology'
  };
  return labels[tag] || 'Unknown';
}

/**
 * Convenience function to convert a tag string name (from API) to a user-friendly display label
 * @param tagName - The enum string name from the API (e.g., "SinAndRepentance")
 * @returns User-friendly label (e.g., "Sin & Repentance")
 */
export function getTagDisplayLabel(tagName: string): string {
  const tagEnum = getMessageTagFromName(tagName);
  return getMessageTagLabel(tagEnum);
}

