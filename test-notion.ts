const token = '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';

async function testBlocks() {
  const pageId = '3ffe76e0-8675-808a-8f9b-d31b948f829e';
  const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Notion-Version': '2022-06-28',
    },
  });
  const data = await res.json();
  console.log('Blocks status:', res.status, 'Count:', data.results?.length);
  for (const b of data.results || []) {
    console.log('Block type:', b.type);
  }
}

testBlocks();
