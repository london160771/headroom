use super::*;
use near_sdk::test_utils::VMContextBuilder;
use near_sdk::{testing_env, AccountId};

const H1: &str = "8229c89e7f27f92f8e59b2c6aa6d2e8747a8d5917839579f793df4f5a4b2c933";
const H2: &str = "781dd4f7cf92de9db443f34b96b782672a15bec9cc730812c0411caa1f59172f";

fn me() -> AccountId {
    "headroom-anchor.near".parse().unwrap()
}

fn ctx(predecessor: &str, height: u64) {
    testing_env!(VMContextBuilder::new()
        .current_account_id(me())
        .predecessor_account_id(predecessor.parse().unwrap())
        .signer_account_id(predecessor.parse().unwrap())
        .block_height(height)
        .block_timestamp(1_763_000_000_000_000_000 + height)
        .build());
}

#[test]
fn anchors_and_reads_back() {
    ctx("headroom-anchor.near", 100);
    let mut c = Contract::default();
    let a = c.anchor(H1.into(), "predictions".into());
    assert_eq!(a.block_height, 100);
    assert_eq!(a.timestamp_ms, 1_763_000_000_000);
    assert_eq!(c.get(H1.into()), Some(a));
    assert_eq!(c.count(), 1);
}

#[test]
fn first_write_wins() {
    ctx("headroom-anchor.near", 100);
    let mut c = Contract::default();
    c.anchor(H1.into(), "first".into());
    ctx("headroom-anchor.near", 200);
    let again = c.anchor(H1.into(), "second".into());
    assert_eq!(again.label, "first");
    assert_eq!(again.block_height, 100);
    assert_eq!(c.count(), 1);
}

#[test]
fn lists_in_order_with_paging() {
    ctx("headroom-anchor.near", 1);
    let mut c = Contract::default();
    c.anchor(H1.into(), "a".into());
    c.anchor(H2.into(), "b".into());
    let all = c.list(None, None);
    assert_eq!(
        all.iter().map(|a| a.label.as_str()).collect::<Vec<_>>(),
        ["a", "b"]
    );
    assert_eq!(c.list(Some(1), Some(10))[0].sha256, H2);
    assert!(c.list(Some(5), None).is_empty());
    assert_eq!(c.get("0".repeat(64)), None);
}

#[test]
#[should_panic(expected = "only the anchor account can add hashes")]
fn others_cannot_anchor() {
    ctx("someone.near", 1);
    Contract::default().anchor(H1.into(), "x".into());
}

#[test]
#[should_panic(expected = "sha256 must be 64 lowercase hex characters")]
fn rejects_bad_hash() {
    ctx("headroom-anchor.near", 1);
    Contract::default().anchor("ABC".into(), "x".into());
}

#[test]
#[should_panic(expected = "label is longer than 200 bytes")]
fn rejects_long_label() {
    ctx("headroom-anchor.near", 1);
    Contract::default().anchor(H1.into(), "x".repeat(201));
}
